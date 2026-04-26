const Balance = require('../models/Balance');
const BalanceHistory = require('../models/BalanceHistory');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const Settlement = require('../models/Settlement');
const SettlementRecord = require('../models/SettlementRecord');
const Notification = require('../models/Notification');

const buildSettlementTransactions = (ledger, userIds, currency) => {
  const creditors = [];
  const debtors = [];

  userIds.forEach((id) => {
    const net = Number((ledger[id] || 0).toFixed(2));
    if (net > 0) creditors.push({ userId: id, amount: net });
    if (net < 0) debtors.push({ userId: id, amount: Math.abs(net) });
  });

  const transactions = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    // Greedy pairing minimizes total number of settlement transfers.
    const transferAmount = Math.min(creditor.amount, debtor.amount);

    transactions.push({
      fromUser: debtor.userId,
      toUser: creditor.userId,
      amount: Number(transferAmount.toFixed(2)),
      currency,
    });

    creditor.amount = Number((creditor.amount - transferAmount).toFixed(2));
    debtor.amount = Number((debtor.amount - transferAmount).toFixed(2));

    if (creditor.amount <= 0.009) creditorIndex += 1;
    if (debtor.amount <= 0.009) debtorIndex += 1;
  }

  return transactions;
};

const recalculateGroupBalances = async (groupId) => {
  const group = await Group.findById(groupId).lean();
  if (!group) throw new Error('Group not found');

  const userIds = group.members.map((memberId) => String(memberId));
  const ledger = {};
  userIds.forEach((id) => { ledger[id] = 0; });

  const expenses = await Expense.find({ groupId }).lean();
  expenses.forEach((expense) => {
    const hasExplicitSplit = Array.isArray(expense.splitEntries) && expense.splitEntries.length > 0;
    if (hasExplicitSplit) {
      expense.splitEntries.forEach((entry) => {
        const key = String(entry.userId);
        ledger[key] = Number(((ledger[key] || 0) - Number(entry.share || 0)).toFixed(2));
      });
    } else {
      const participantCount = expense.participants.length;
      if (participantCount === 0) return;
      const splitAmount = expense.convertedAmount / participantCount;
      expense.participants.forEach((participantId) => {
        const key = String(participantId);
        ledger[key] = Number(((ledger[key] || 0) - splitAmount).toFixed(2));
      });
    }

    const payerId = String(expense.paidBy);
    ledger[payerId] = Number(((ledger[payerId] || 0) + expense.convertedAmount).toFixed(2));
  });

  const settlementRecords = await SettlementRecord.find({ groupId, status: 'completed' }).lean();
  settlementRecords.forEach((record) => {
    const fromKey = String(record.fromUser);
    const toKey = String(record.toUser);
    const amount = Number(record.amount || 0);
    ledger[fromKey] = Number(((ledger[fromKey] || 0) + amount).toFixed(2));
    ledger[toKey] = Number(((ledger[toKey] || 0) - amount).toFixed(2));
  });

  await Balance.deleteMany({ groupId });
  const balanceDocs = userIds.map((userId) => {
    const net = Number((ledger[userId] || 0).toFixed(2));
    return {
      groupId,
      userId,
      owes: net < 0 ? Number(Math.abs(net).toFixed(2)) : 0,
      owed: net > 0 ? Number(net.toFixed(2)) : 0,
    };
  });

  if (balanceDocs.length > 0) await Balance.insertMany(balanceDocs);
  if (balanceDocs.length > 0) {
    await BalanceHistory.insertMany(balanceDocs.map((item) => ({ ...item, reason: 'expense_update' })));
  }

  await Notification.deleteMany({ groupId, type: 'balance_reminder' });
  const reminders = balanceDocs
    .filter((item) => item.owes > 0)
    .map((item) => ({
      userId: item.userId,
      groupId,
      type: 'balance_reminder',
      message: `You owe ${item.owes.toFixed(2)} in this group. Consider settling up.`,
    }));
  if (reminders.length > 0) await Notification.insertMany(reminders);

  const transactions = buildSettlementTransactions(ledger, userIds, group.baseCurrency);
  await Settlement.findOneAndUpdate(
    { groupId },
    { groupId, currency: group.baseCurrency, transactions },
    { upsert: true, new: true }
  );

  return { balances: balanceDocs, transactions };
};

module.exports = { recalculateGroupBalances };

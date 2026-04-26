const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Balance = require('../models/Balance');
const Settlement = require('../models/Settlement');
const SettlementRecord = require('../models/SettlementRecord');
const Group = require('../models/Group');

const getGroupDashboard = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid group id' });
    }

    const group = await Group.findById(groupId).populate('members', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const requesterId = String(req.user.userId);
    const isMember = group.members.some((member) => String(member._id) === requesterId);
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const [expenses, balances, settlement, settlementHistory] = await Promise.all([
      Expense.find({ groupId }).populate('paidBy', 'name email').sort({ date: -1 }).lean(),
      Balance.find({ groupId }).populate('userId', 'name email'),
      Settlement.findOne({ groupId })
        .populate('transactions.fromUser', 'name email')
        .populate('transactions.toUser', 'name email'),
      SettlementRecord.find({ groupId }).populate('fromUser', 'name').populate('toUser', 'name').sort({ completedAt: -1 }).limit(20).lean(),
    ]);

    const totalExpenseBase = expenses.reduce((sum, item) => sum + item.convertedAmount, 0);
    const categoryMap = {};
    expenses.forEach((expense) => {
      const key = expense.category || 'General';
      categoryMap[key] = Number(((categoryMap[key] || 0) + expense.convertedAmount).toFixed(2));
    });

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    const spenderMap = {};
    const monthlyMap = {};
    expenses.forEach((expense) => {
      const payerName = expense.paidBy?.name || 'Unknown';
      spenderMap[payerName] = Number(((spenderMap[payerName] || 0) + expense.convertedAmount).toFixed(2));
      const monthKey = new Date(expense.date).toISOString().slice(0, 7);
      monthlyMap[monthKey] = Number(((monthlyMap[monthKey] || 0) + expense.convertedAmount).toFixed(2));
    });

    const topSpender = Object.entries(spenderMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)[0] || null;

    const monthlyTrends = Object.entries(monthlyMap)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const recentActivity = [
      ...expenses.slice(0, 10).map((item) => ({
        type: 'expense',
        date: item.date,
        message: `${item.paidBy?.name || 'Someone'} added ${item.description || 'an expense'} (${item.amount} ${item.currency})`,
      })),
      ...settlementHistory.slice(0, 10).map((item) => ({
        type: 'settlement',
        date: item.completedAt || item.createdAt,
        message: `${item.fromUser?.name || 'Member'} settled ${item.amount} ${item.currency} to ${item.toUser?.name || 'member'}`,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);

    return res.status(200).json({
      group,
      summary: {
        totalExpenses: expenses.length,
        totalExpenseBase: Number(totalExpenseBase.toFixed(2)),
        baseCurrency: group.baseCurrency,
      },
      categoryBreakdown,
      monthlyTrends,
      topSpender,
      settlementHistory,
      recentActivity,
      balances,
      settlements: settlement ? settlement.transactions : [],
      recentTransactions: expenses.slice(0, 5),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getGroupDashboard };

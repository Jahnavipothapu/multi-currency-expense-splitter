const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const Notification = require('../models/Notification');
const { convertCurrency } = require('../services/currencyService');
const { recalculateGroupBalances } = require('../services/balanceService');

const validateMembersAndParticipants = (group, requesterId, paidBy, participants) => {
  const memberIds = group.members.map((memberId) => String(memberId));

  if (!memberIds.includes(requesterId)) {
    return 'Only group members can manage expenses';
  }

  if (!memberIds.includes(String(paidBy))) {
    return 'Payer must be a group member';
  }

  const cleanParticipants = [...new Set(participants.map((id) => String(id)))];
  const allParticipantsAreMembers = cleanParticipants.every((id) => memberIds.includes(id));
  if (!allParticipantsAreMembers) {
    return 'Participants must be group members';
  }

  return null;
};

const buildSplitEntries = (splitType, cleanParticipants, splitValues, convertedAmount) => {
  if (splitType === 'exact') {
    const entries = cleanParticipants.map((id) => ({
      userId: id,
      share: Number(splitValues[id] || 0),
    }));
    const total = entries.reduce((sum, item) => sum + item.share, 0);
    if (Math.abs(total - convertedAmount) > 0.01) {
      throw new Error('Exact split must match total converted amount');
    }
    return entries;
  }

  if (splitType === 'percentage') {
    const entries = cleanParticipants.map((id) => ({
      userId: id,
      percentage: Number(splitValues[id] || 0),
    }));
    const totalPct = entries.reduce((sum, item) => sum + item.percentage, 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      throw new Error('Percentage split must total 100');
    }
    return entries.map((entry) => ({
      userId: entry.userId,
      percentage: entry.percentage,
      share: Number(((convertedAmount * entry.percentage) / 100).toFixed(2)),
    }));
  }

  const perHead = convertedAmount / Math.max(cleanParticipants.length, 1);
  return cleanParticipants.map((id) => ({
    userId: id,
    share: Number(perHead.toFixed(2)),
  }));
};

const createExpenseNotifications = async (groupId, expense, memberIds, requesterId) => {
  const notifications = memberIds
    .filter((memberId) => String(memberId) !== String(requesterId))
    .map((memberId) => ({
      userId: memberId,
      groupId,
      expenseId: expense._id,
      type: 'expense_added',
      message: `New expense added: ${expense.description || 'Expense'} (${expense.amount} ${expense.currency})`,
    }));

  if (notifications.length > 0) await Notification.insertMany(notifications);
};

const addExpense = async (req, res) => {
  try {
    const { groupId, amount, currency, paidBy, participants, splitType, splitValues, category, description, date } = req.body;

    if (!groupId || !amount || !currency || !paidBy || !participants || participants.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid group id' });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const validationError = validateMembersAndParticipants(group, String(req.user.userId), paidBy, participants);
    if (validationError) return res.status(400).json({ message: validationError });

    const cleanParticipants = [...new Set(participants.map((id) => String(id)))];

    const normalizedCurrency = String(currency).toUpperCase();
    const convertedAmount = await convertCurrency(numericAmount, normalizedCurrency, group.baseCurrency);
    const nextSplitType = ['equal', 'exact', 'percentage'].includes(splitType) ? splitType : 'equal';
    const normalizedSplitValues = splitValues || {};
    const splitEntries = buildSplitEntries(nextSplitType, cleanParticipants, normalizedSplitValues, convertedAmount);

    const expense = await Expense.create({
      groupId,
      amount: numericAmount,
      currency: normalizedCurrency,
      convertedAmount,
      baseCurrency: group.baseCurrency,
      paidBy,
      participants: cleanParticipants,
      splitType: nextSplitType,
      splitEntries,
      category: category ? String(category).trim() : 'General',
      description: description ? String(description).trim() : '',
      date: date ? new Date(date) : new Date(),
    });

    await createExpenseNotifications(groupId, expense, group.members.map((m) => String(m)), req.user.userId);
    await recalculateGroupBalances(groupId);
    return res.status(201).json(expense);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { amount, currency, paidBy, participants, splitType, splitValues, category, description, date } = req.body;

    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return res.status(400).json({ message: 'Invalid expense id' });
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const group = await Group.findById(expense.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const nextParticipants = participants && participants.length > 0 ? participants : expense.participants.map((id) => String(id));
    const nextPaidBy = paidBy || expense.paidBy;

    const validationError = validateMembersAndParticipants(group, String(req.user.userId), nextPaidBy, nextParticipants);
    if (validationError) return res.status(400).json({ message: validationError });

    const numericAmount = amount !== undefined ? Number(amount) : expense.amount;
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const normalizedCurrency = currency ? String(currency).toUpperCase() : expense.currency;
    const convertedAmount = await convertCurrency(numericAmount, normalizedCurrency, group.baseCurrency);
    const nextSplitType = ['equal', 'exact', 'percentage'].includes(splitType) ? splitType : expense.splitType || 'equal';
    const normalizedSplitValues = splitValues || {};
    const splitEntries = buildSplitEntries(nextSplitType, [...new Set(nextParticipants.map((id) => String(id)))], normalizedSplitValues, convertedAmount);

    expense.amount = numericAmount;
    expense.currency = normalizedCurrency;
    expense.convertedAmount = convertedAmount;
    expense.paidBy = nextPaidBy;
    expense.participants = [...new Set(nextParticipants.map((id) => String(id)))];
    expense.splitType = nextSplitType;
    expense.splitEntries = splitEntries;
    expense.category = category ? String(category).trim() : expense.category;
    expense.description = description !== undefined ? String(description).trim() : expense.description;
    expense.date = date ? new Date(date) : expense.date;

    await expense.save();
    await recalculateGroupBalances(group._id);

    return res.status(200).json(expense);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const listGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid group id' });
    }

    const group = await Group.findById(groupId).lean();
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const requesterId = String(req.user.userId);
    const isMember = group.members.some((memberId) => String(memberId) == requesterId);
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const query = { groupId };
    const { q, category, memberId, startDate, endDate } = req.query;
    if (category) query.category = category;
    if (memberId) query.participants = memberId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (q) query.description = { $regex: String(q), $options: 'i' };

    const expenses = await Expense.find(query)
      .populate('paidBy', 'name email')
      .populate('participants', 'name email')
      .sort({ date: -1 })
      .lean();

    const mapped = expenses.map((expense) => ({
      ...expense,
      sharePerParticipant: Number((expense.convertedAmount / Math.max(expense.participants.length, 1)).toFixed(2)),
      conversionRate: Number((expense.convertedAmount / Math.max(expense.amount, 1)).toFixed(6)),
    }));

    return res.status(200).json(mapped);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return res.status(400).json({ message: 'Invalid expense id' });
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const group = await Group.findById(expense.groupId).lean();
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const isMember = group.members.some((memberId) => String(memberId) === String(req.user.userId));
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    await Expense.deleteOne({ _id: expenseId });
    await recalculateGroupBalances(expense.groupId);
    return res.status(200).json({ message: 'Expense deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { addExpense, updateExpense, listGroupExpenses, deleteExpense };

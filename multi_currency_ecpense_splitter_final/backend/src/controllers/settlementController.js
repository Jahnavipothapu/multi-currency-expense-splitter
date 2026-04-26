const mongoose = require('mongoose');
const Group = require('../models/Group');
const SettlementRecord = require('../models/SettlementRecord');
const { recalculateGroupBalances } = require('../services/balanceService');
const { convertCurrency } = require('../services/currencyService');

const completeSettlement = async (req, res) => {
  try {
    const { groupId, fromUser, toUser, amount, currency, notes } = req.body;
    if (!groupId || !fromUser || !toUser || !amount || !currency) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid group id' });
    }

    const group = await Group.findById(groupId).lean();
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const isMember = group.members.some((id) => String(id) === String(req.user.userId));
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const convertedAmount = await convertCurrency(Number(amount), String(currency).toUpperCase(), group.baseCurrency);

    const record = await SettlementRecord.create({
      groupId,
      fromUser,
      toUser,
      amount: Number(convertedAmount),
      currency: group.baseCurrency,
      notes: notes ? String(notes) : '',
      status: 'completed',
      completedAt: new Date(),
      createdBy: req.user.userId,
    });

    await recalculateGroupBalances(groupId);
    return res.status(201).json(record);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSettlementHistory = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid group id' });
    }

    const group = await Group.findById(groupId).lean();
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const isMember = group.members.some((id) => String(id) === String(req.user.userId));
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const records = await SettlementRecord.find({ groupId })
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { completeSettlement, getSettlementHistory };

const mongoose = require('mongoose');

const balanceHistorySchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    owes: { type: Number, default: 0 },
    owed: { type: Number, default: 0 },
    reason: { type: String, default: 'recalculation' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BalanceHistory', balanceHistorySchema);

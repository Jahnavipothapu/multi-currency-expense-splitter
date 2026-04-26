const mongoose = require('mongoose');

const balanceSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    owes: { type: Number, default: 0 },
    owed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

balanceSchema.index({ groupId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Balance', balanceSchema);

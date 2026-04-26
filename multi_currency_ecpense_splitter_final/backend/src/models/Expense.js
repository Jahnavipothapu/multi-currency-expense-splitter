const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    convertedAmount: { type: Number, required: true },
    baseCurrency: { type: String, required: true },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    splitType: { type: String, enum: ['equal', 'exact', 'percentage'], default: 'equal' },
    splitEntries: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        share: { type: Number, required: true },
        percentage: { type: Number, default: null },
      },
    ],
    category: { type: String, default: 'General' },
    description: { type: String, default: '' },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);

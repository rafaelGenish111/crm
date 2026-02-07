const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    required: true,
    unique: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'ILS',
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'bank_transfer', 'check', 'other'],
  },
}, {
  timestamps: true,
});

receiptSchema.index({ receiptNumber: 1 });
receiptSchema.index({ customer: 1 });
receiptSchema.index({ issueDate: -1 });

module.exports = mongoose.model('Receipt', receiptSchema);

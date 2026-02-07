const mongoose = require('mongoose');

const customerInteractionSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  type: {
    type: String,
    enum: ['call', 'whatsapp', 'email', 'meeting', 'document', 'note'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  content: {
    type: String,
    trim: true,
  },
  documentUrl: {
    type: String,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  scheduledAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

customerInteractionSchema.index({ customer: 1, createdAt: -1 });
customerInteractionSchema.index({ performedBy: 1 });

module.exports = mongoose.model('CustomerInteraction', customerInteractionSchema);

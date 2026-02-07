const mongoose = require('mongoose');

const leadInteractionSchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
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
    type: String, // For WhatsApp messages, email content, etc.
    trim: true,
  },
  documentUrl: {
    type: String, // If type is 'document'
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  scheduledAt: {
    type: Date, // For scheduled calls/meetings
  },
  completedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
leadInteractionSchema.index({ lead: 1, createdAt: -1 });
leadInteractionSchema.index({ performedBy: 1 });

module.exports = mongoose.model('LeadInteraction', leadInteractionSchema);

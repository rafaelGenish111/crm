const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'שם הוא שדה חובה'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'אימייל לא תקין'],
  },
  phone: {
    type: String,
    required: [true, 'טלפון הוא שדה חובה'],
    trim: true,
  },
  source: {
    type: String,
    required: [true, 'מקור ליד הוא שדה חובה'],
    enum: ['landing_page', 'referral', 'social_media', 'advertisement', 'phone_call', 'other'],
    default: 'other',
  },
  sourceDetails: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
    default: 'new',
  },
  notes: {
    type: String,
    trim: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  convertedToCustomer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  },
  convertedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
leadSchema.index({ email: 1 });
leadSchema.index({ phone: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Lead', leadSchema);

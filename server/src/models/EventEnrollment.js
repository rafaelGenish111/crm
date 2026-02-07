const mongoose = require('mongoose');

const eventEnrollmentSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'attended', 'cancelled', 'no_show'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed', 'refunded', 'cancelled'],
    default: 'pending',
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: [0, 'סכום ששולם חייב להיות חיובי'],
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Validation: לפחות אחד מ-customer או lead חייב להיות
eventEnrollmentSchema.pre('validate', function (next) {
  if (!this.customer && !this.lead) {
    this.invalidate('customer', 'נדרש לקוח או ליד');
    this.invalidate('lead', 'נדרש לקוח או ליד');
  }
  if (typeof next === 'function') {
    next();
  }
});

eventEnrollmentSchema.index({ event: 1 });
eventEnrollmentSchema.index({ customer: 1 });
eventEnrollmentSchema.index({ lead: 1 });
eventEnrollmentSchema.index({ status: 1 });

module.exports = mongoose.model('EventEnrollment', eventEnrollmentSchema);

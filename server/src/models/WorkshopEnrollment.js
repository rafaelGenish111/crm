const mongoose = require('mongoose');

const workshopEnrollmentSchema = new mongoose.Schema({
  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
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
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['enrolled', 'attended', 'cancelled'],
    default: 'enrolled',
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

workshopEnrollmentSchema.index({ workshop: 1 });
workshopEnrollmentSchema.index({ customer: 1 });
workshopEnrollmentSchema.index({ lead: 1 });

module.exports = mongoose.model('WorkshopEnrollment', workshopEnrollmentSchema);

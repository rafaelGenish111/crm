const mongoose = require('mongoose');

const courseEnrollmentSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
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
    enum: ['pending', 'approved', 'enrolled', 'completed', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed', 'cancelled'],
    default: 'pending',
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Validation: לפחות אחד מ-customer או lead חייב להיות
courseEnrollmentSchema.pre('validate', function (next) {
  if (!this.customer && !this.lead) {
    this.invalidate('customer', 'נדרש לקוח או ליד');
    this.invalidate('lead', 'נדרש לקוח או ליד');
  }
  if (typeof next === 'function') {
    next();
  }
});

courseEnrollmentSchema.index({ course: 1 });
courseEnrollmentSchema.index({ customer: 1 });
courseEnrollmentSchema.index({ lead: 1 });

module.exports = mongoose.model('CourseEnrollment', courseEnrollmentSchema);

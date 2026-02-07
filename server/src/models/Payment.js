const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'סכום הוא שדה חובה'],
    min: [0, 'סכום חייב להיות חיובי'],
  },
  currency: {
    type: String,
    default: 'ILS',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'bank_transfer', 'check', 'cardcom', 'other'],
    default: 'cash',
  },
  numberOfPayments: {
    type: Number,
    min: [1, 'מספר תשלומים חייב להיות לפחות 1'],
    default: 1,
  },
  paymentPlan: {
    type: String,
    enum: ['single', 'monthly', 'biweekly', 'custom'],
    default: 'single',
  },
  enrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'enrollmentType',
  },
  enrollmentType: {
    type: String,
    enum: ['CourseEnrollment', 'WorkshopEnrollment'],
  },
  paymentIndex: {
    type: Number,
    default: 1,
    min: [1, 'אינדקס תשלום חייב להיות לפחות 1'],
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
    trim: true,
  },
  relatedTo: {
    type: {
      type: String,
      enum: ['course', 'workshop', 'other'],
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  receiptNumber: {
    type: String,
    sparse: true,
  },
  invoiceNumber: {
    type: String,
  },
  cardLastDigits: {
    type: String,
  },
  transactionId: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'refunded'],
    default: 'completed',
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

paymentSchema.index({ customer: 1, paymentDate: -1 });
paymentSchema.index({ receiptNumber: 1 }, { unique: true, sparse: true });
paymentSchema.index({ invoiceNumber: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'שם קורס הוא שדה חובה'],
    trim: true,
  },
  subject: {
    type: String,
    required: [true, 'נושא הוא שדה חובה'],
    trim: true,
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'מחיר חייב להיות חיובי'],
  },
  capacity: {
    type: Number,
    required: true,
    min: [1, 'קיבולת חייבת להיות לפחות 1'],
  },
  description: {
    type: String,
    trim: true,
  },
  numberOfSessions: {
    type: Number,
    min: [1, 'מספר מפגשים חייב להיות לפחות 1'],
  },
  dayOfWeek: {
    type: String,
    enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  },
  holidays: [{
    type: Date,
  }],
  additionalStaff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  requiredEquipment: [{
    type: String,
    trim: true,
  }],
  location: {
    type: String,
    trim: true,
  },
  syllabus: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

courseSchema.index({ instructor: 1 });
courseSchema.index({ subject: 1 });
courseSchema.index({ startDate: 1 });

module.exports = mongoose.model('Course', courseSchema);

const mongoose = require('mongoose');

const workshopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'שם סדנה הוא שדה חובה'],
    trim: true,
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number, // in hours
    default: 2,
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
  location: {
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

workshopSchema.index({ instructor: 1 });
workshopSchema.index({ date: 1 });

module.exports = mongoose.model('Workshop', workshopSchema);

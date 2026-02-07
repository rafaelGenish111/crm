const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'שם מבחן הוא שדה חובה'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['exam', 'quiz', 'assignment', 'project'],
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  maxScore: {
    type: Number,
    required: true,
    min: [1, 'ציון מקסימלי חייב להיות לפחות 1'],
    default: 100,
  },
  weight: {
    type: Number,
    min: [0, 'משקל חייב להיות חיובי'],
    max: [100, 'משקל לא יכול להיות יותר מ-100%'],
    default: 0,
  },
  description: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

examSchema.index({ course: 1, date: -1 });
examSchema.index({ course: 1, type: 1 });

module.exports = mongoose.model('Exam', examSchema);

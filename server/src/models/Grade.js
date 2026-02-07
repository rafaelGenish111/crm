const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseEnrollment',
    required: true,
  },
  score: {
    type: Number,
    required: true,
    min: [0, 'ציון לא יכול להיות שלילי'],
  },
  percentage: {
    type: Number,
    min: [0, 'אחוז לא יכול להיות שלילי'],
    max: [100, 'אחוז לא יכול להיות יותר מ-100'],
  },
  notes: {
    type: String,
    trim: true,
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

gradeSchema.index({ exam: 1, enrollment: 1 }, { unique: true });
gradeSchema.index({ enrollment: 1 });

module.exports = mongoose.model('Grade', gradeSchema);

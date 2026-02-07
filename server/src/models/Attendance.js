const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  sessionNumber: {
    type: Number,
    required: true,
    min: [1, 'מספר מפגש חייב להיות לפחות 1'],
  },
  sessionDate: {
    type: Date,
    required: true,
  },
  attendees: [{
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseEnrollment',
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      default: 'absent',
    },
    notes: {
      type: String,
      trim: true,
    },
  }],
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

attendanceSchema.index({ course: 1, sessionNumber: 1 }, { unique: true });
attendanceSchema.index({ course: 1, sessionDate: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

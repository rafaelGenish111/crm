const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'שם אירוע הוא שדה חובה'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['conference', 'webinar', 'workshop', 'seminar', 'meetup', 'other'],
    required: [true, 'סוג אירוע הוא שדה חובה'],
  },
  description: {
    type: String,
    trim: true,
  },
  organizer: {
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
    required: true,
  },
  location: {
    type: String,
    trim: true,
  },
  onlineLink: {
    type: String,
    trim: true,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'מחיר חייב להיות חיובי'],
    default: 0,
  },
  capacity: {
    type: Number,
    required: true,
    min: [1, 'קיבולת חייבת להיות לפחות 1'],
  },
  speakers: [{
    name: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
  }],
  agenda: [{
    time: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    speaker: {
      type: String,
      trim: true,
    },
  }],
  tags: [{
    type: String,
    trim: true,
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft',
  },
  registrationDeadline: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

eventSchema.index({ organizer: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ isActive: 1 });

module.exports = mongoose.model('Event', eventSchema);

const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'שם קמפיין הוא שדה חובה'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  targetAudience: {
    ageRange: {
      min: Number,
      max: Number,
    },
    interests: [String],
    location: String,
  },
  marketingChannels: [{
    type: String,
    enum: ['facebook', 'instagram', 'google_ads', 'email', 'whatsapp', 'other'],
  }],
  budget: {
    type: Number,
    min: [0, 'תקציב חייב להיות חיובי'],
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Link to event (optional)
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  },
  // Popup Configuration
  popup: {
    enabled: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    ctaText: {
      type: String,
      trim: true,
      default: 'לחץ כאן',
    },
    ctaUrl: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      enum: ['center', 'bottom-right', 'bottom-left', 'top-right', 'top-left'],
      default: 'center',
    },
    delay: {
      type: Number,
      default: 3000, // milliseconds
      min: 0,
    },
    backgroundColor: {
      type: String,
      default: '#ffffff',
    },
    textColor: {
      type: String,
      default: '#000000',
    },
    buttonColor: {
      type: String,
      default: '#007bff',
    },
    buttonTextColor: {
      type: String,
      default: '#ffffff',
    },
  },
  // Targeting Configuration
  targeting: {
    customerIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    }],
    leadIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    }],
    courseIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    }],
    workshopIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workshop',
    }],
    allowedDomains: [{
      type: String,
      trim: true,
    }],
    showToAll: {
      type: Boolean,
      default: false,
    },
  },
  // Embed Token for public access
  embedToken: {
    type: String,
    unique: true,
    sparse: true,
  },
}, {
  timestamps: true,
});

campaignSchema.index({ status: 1 });
campaignSchema.index({ startDate: 1 });
campaignSchema.index({ embedToken: 1 });
campaignSchema.index({ 'targeting.customerIds': 1 });
campaignSchema.index({ 'targeting.leadIds': 1 });
campaignSchema.index({ 'targeting.courseIds': 1 });
campaignSchema.index({ 'targeting.workshopIds': 1 });
campaignSchema.index({ 'targeting.eventIds': 1 });
campaignSchema.index({ event: 1 });

// Generate embed token before saving
campaignSchema.pre('save', async function () {
  if (this.popup && this.popup.enabled && !this.embedToken) {
    const crypto = require('crypto');
    this.embedToken = crypto.randomBytes(32).toString('hex');
  }
});

module.exports = mongoose.model('Campaign', campaignSchema);

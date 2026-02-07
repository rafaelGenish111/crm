const mongoose = require('mongoose');

const campaignPerformanceSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  impressions: {
    type: Number,
    default: 0,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  conversions: {
    type: Number,
    default: 0,
  },
  leads: {
    type: Number,
    default: 0,
  },
  cost: {
    type: Number,
    default: 0,
  },
  revenue: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

campaignPerformanceSchema.index({ campaign: 1, date: -1 });

module.exports = mongoose.model('CampaignPerformance', campaignPerformanceSchema);

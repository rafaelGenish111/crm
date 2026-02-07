const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  // Context for RAG
  context: {
    knowledgeSources: [{
      knowledgeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'KnowledgeBase',
      },
      relevanceScore: Number,
    }],
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    intent: {
      type: String,
      enum: ['question', 'exam', 'advice', 'study_plan', 'general'],
      default: 'question',
    },
  },
  // For exam mode
  examData: {
    isExam: {
      type: Boolean,
      default: false,
    },
    question: String,
    correctAnswer: String,
    studentAnswer: String,
    score: Number,
    feedback: String,
  },
  // Response metadata
  metadata: {
    tokensUsed: Number,
    model: String,
    responseTime: Number,
  },
}, {
  timestamps: true,
});

chatMessageSchema.index({ student: 1, createdAt: -1 });
chatMessageSchema.index({ 'context.intent': 1 });
chatMessageSchema.index({ 'examData.isExam': 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);

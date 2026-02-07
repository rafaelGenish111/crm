const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'כותרת היא שדה חובה'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'תוכן הוא שדה חובה'],
    trim: true,
  },
  category: {
    type: String,
    enum: ['course_material', 'study_guide', 'exam_prep', 'general_advice', 'course_specific'],
    default: 'general_advice',
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null, // null = כללי לכל הקורסים
  },
  tags: [{
    type: String,
    trim: true,
  }],
  // Embedding vector (stored as array of numbers)
  embedding: {
    type: [Number],
    select: false, // לא להחזיר ב-default queries
  },
  // Metadata for RAG
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'course_syllabus', 'exam', 'workshop'],
      default: 'manual',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    relevanceScore: {
      type: Number,
      default: 1.0,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  lastUsed: {
    type: Date,
  },
}, {
  timestamps: true,
});

knowledgeBaseSchema.index({ category: 1 });
knowledgeBaseSchema.index({ course: 1 });
knowledgeBaseSchema.index({ tags: 1 });
knowledgeBaseSchema.index({ isActive: 1 });
knowledgeBaseSchema.index({ 'metadata.source': 1 });

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);

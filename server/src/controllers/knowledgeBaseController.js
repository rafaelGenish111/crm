const KnowledgeBase = require('../models/KnowledgeBase');
const aiService = require('../services/aiService');

/**
 * Get all knowledge base entries
 */
const getKnowledgeEntries = async (req, res) => {
  try {
    const { category, courseId, search, isActive } = req.query;

    const query = {};

    if (category) query.category = category;
    if (courseId) query.course = courseId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const entries = await KnowledgeBase.find(query)
      .populate('course', 'name')
      .populate('metadata.author', 'name email')
      .sort({ createdAt: -1 });

    res.json({ entries });
  } catch (error) {
    console.error('Error getting knowledge entries:', error);
    res.status(500).json({ message: 'שגיאה בקבלת ערכי ידע' });
  }
};

/**
 * Get knowledge entry by ID
 */
const getKnowledgeEntryById = async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await KnowledgeBase.findById(id)
      .populate('course', 'name')
      .populate('metadata.author', 'name email');

    if (!entry) {
      return res.status(404).json({ message: 'ערך ידע לא נמצא' });
    }

    res.json({ entry });
  } catch (error) {
    console.error('Error getting knowledge entry:', error);
    res.status(500).json({ message: 'שגיאה בקבלת ערך ידע' });
  }
};

/**
 * Create knowledge base entry
 */
const createKnowledgeEntry = async (req, res) => {
  try {
    const { title, content, category, course, tags, metadata } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'כותרת ותוכן הם שדות חובה' });
    }

    // Generate embedding
    let embedding = null;
    try {
      embedding = await aiService.generateEmbedding(`${title}\n\n${content}`);
    } catch (error) {
      console.warn('Failed to generate embedding:', error.message);
      // Continue without embedding - will use fallback search
    }

    const entry = await KnowledgeBase.create({
      title,
      content,
      category: category || 'general_advice',
      course: course || null,
      tags: tags || [],
      metadata: {
        ...metadata,
        author: req.user._id,
        source: metadata?.source || 'manual',
      },
      embedding,
    });

    // Populate references
    await entry.populate('course', 'name');
    await entry.populate('metadata.author', 'name email');

    res.status(201).json({
      message: 'ערך ידע נוצר בהצלחה',
      entry,
    });
  } catch (error) {
    console.error('Error creating knowledge entry:', error);
    res.status(500).json({ message: 'שגיאה ביצירת ערך ידע' });
  }
};

/**
 * Update knowledge base entry
 */
const updateKnowledgeEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, course, tags, isActive } = req.body;

    const entry = await KnowledgeBase.findById(id);

    if (!entry) {
      return res.status(404).json({ message: 'ערך ידע לא נמצא' });
    }

    // Update fields
    if (title) entry.title = title;
    if (content) entry.content = content;
    if (category) entry.category = category;
    if (course !== undefined) entry.course = course;
    if (tags) entry.tags = tags;
    if (isActive !== undefined) entry.isActive = isActive;

    // Regenerate embedding if content changed
    if (title || content) {
      try {
        const newContent = `${entry.title}\n\n${entry.content}`;
        entry.embedding = await aiService.generateEmbedding(newContent);
      } catch (error) {
        console.warn('Failed to regenerate embedding:', error.message);
      }
    }

    await entry.save();

    await entry.populate('course', 'name');
    await entry.populate('metadata.author', 'name email');

    res.json({
      message: 'ערך ידע עודכן בהצלחה',
      entry,
    });
  } catch (error) {
    console.error('Error updating knowledge entry:', error);
    res.status(500).json({ message: 'שגיאה בעדכון ערך ידע' });
  }
};

/**
 * Delete knowledge base entry
 */
const deleteKnowledgeEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await KnowledgeBase.findByIdAndDelete(id);

    if (!entry) {
      return res.status(404).json({ message: 'ערך ידע לא נמצא' });
    }

    res.json({ message: 'ערך ידע נמחק בהצלחה' });
  } catch (error) {
    console.error('Error deleting knowledge entry:', error);
    res.status(500).json({ message: 'שגיאה במחיקת ערך ידע' });
  }
};

/**
 * Bulk import knowledge from course syllabus
 */
const importFromCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const Course = require('../models/Course');
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: 'קורס לא נמצא' });
    }

    if (!course.syllabus) {
      return res.status(400).json({ message: 'לקורס אין תוכנית לימודים' });
    }

    // Split syllabus into chunks (simple approach)
    const chunks = course.syllabus.split(/\n\n+/).filter((chunk) => chunk.trim().length > 50);

    const entries = [];

    for (const chunk of chunks) {
      const title = chunk.split('\n')[0].substring(0, 100) || `חלק מתוכנית הלימודים - ${course.name}`;

      try {
        const embedding = await aiService.generateEmbedding(`${title}\n\n${chunk}`);

        const entry = await KnowledgeBase.create({
          title,
          content: chunk,
          category: 'course_material',
          course: courseId,
          tags: [course.subject, course.name],
          metadata: {
            author: req.user._id,
            source: 'course_syllabus',
          },
          embedding,
        });

        entries.push(entry);
      } catch (error) {
        console.warn('Failed to create entry for chunk:', error.message);
      }
    }

    res.json({
      message: `נוצרו ${entries.length} ערכי ידע מתוכנית הלימודים`,
      entries,
    });
  } catch (error) {
    console.error('Error importing from course:', error);
    res.status(500).json({ message: 'שגיאה בייבוא מתוכנית הלימודים' });
  }
};

module.exports = {
  getKnowledgeEntries,
  getKnowledgeEntryById,
  createKnowledgeEntry,
  updateKnowledgeEntry,
  deleteKnowledgeEntry,
  importFromCourse,
};

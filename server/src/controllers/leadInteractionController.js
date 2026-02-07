const LeadInteraction = require('../models/LeadInteraction');

/**
 * יצירת אינטראקציה חדשה עם ליד
 */
const createInteraction = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { type, title, description, content, documentUrl, scheduledAt } = req.body;

    if (!type || !title) {
      return res.status(400).json({ message: 'סוג וכותרת הם שדות חובה' });
    }

    const interaction = await LeadInteraction.create({
      lead: leadId,
      type,
      title,
      description,
      content,
      documentUrl,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      performedBy: req.user._id,
      completedAt: type !== 'call' && type !== 'meeting' ? new Date() : undefined,
    });

    res.status(201).json({
      message: 'אינטראקציה נוצרה בהצלחה',
      interaction,
    });
  } catch (error) {
    console.error('Create interaction error:', error);
    res.status(500).json({ message: 'שגיאה ביצירת אינטראקציה' });
  }
};

/**
 * עדכון אינטראקציה
 */
const updateInteraction = async (req, res) => {
  try {
    const { interactionId } = req.params;
    const updates = req.body;

    if (updates.scheduledAt) {
      updates.scheduledAt = new Date(updates.scheduledAt);
    }
    if (updates.completedAt) {
      updates.completedAt = new Date(updates.completedAt);
    }

    const interaction = await LeadInteraction.findByIdAndUpdate(
      interactionId,
      updates,
      { new: true, runValidators: true }
    ).populate('performedBy', 'name email');

    if (!interaction) {
      return res.status(404).json({ message: 'אינטראקציה לא נמצאה' });
    }

    res.json({
      message: 'אינטראקציה עודכנה בהצלחה',
      interaction,
    });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בעדכון אינטראקציה' });
  }
};

/**
 * מחיקת אינטראקציה
 */
const deleteInteraction = async (req, res) => {
  try {
    const { interactionId } = req.params;

    const interaction = await LeadInteraction.findByIdAndDelete(interactionId);

    if (!interaction) {
      return res.status(404).json({ message: 'אינטראקציה לא נמצאה' });
    }

    res.json({ message: 'אינטראקציה נמחקה בהצלחה' });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה במחיקת אינטראקציה' });
  }
};

module.exports = {
  createInteraction,
  updateInteraction,
  deleteInteraction,
};

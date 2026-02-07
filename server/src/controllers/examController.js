const Exam = require('../models/Exam');
const Grade = require('../models/Grade');
const CourseEnrollment = require('../models/CourseEnrollment');

/**
 * קבלת מבחנים לקורס
 */
const getExamsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const exams = await Exam.find({ course: courseId })
      .populate('createdBy', 'name email')
      .sort({ date: -1 });

    res.json({ exams });
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ message: 'שגיאה בקבלת מבחנים' });
  }
};

/**
 * קבלת מבחן לפי ID
 */
const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!exam) {
      return res.status(404).json({ message: 'מבחן לא נמצא' });
    }

    // קבלת כל הציונים למבחן
    const grades = await Grade.find({ exam: exam._id })
      .populate({
        path: 'enrollment',
        populate: [
          { path: 'customer', select: 'name phone email' },
          { path: 'lead', select: 'name phone email' }
        ]
      })
      .populate('gradedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ exam, grades });
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({ message: 'שגיאה בקבלת מבחן' });
  }
};

/**
 * יצירת מבחן חדש
 */
const createExam = async (req, res) => {
  try {
    const exam = await Exam.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const populated = await Exam.findById(exam._id)
      .populate('createdBy', 'name email');

    res.status(201).json({ message: 'מבחן נוצר בהצלחה', exam: populated });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ message: 'שגיאה ביצירת מבחן' });
  }
};

/**
 * עדכון מבחן
 */
const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'name email');

    if (!exam) {
      return res.status(404).json({ message: 'מבחן לא נמצא' });
    }

    res.json({ message: 'מבחן עודכן בהצלחה', exam });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ message: 'שגיאה בעדכון מבחן' });
  }
};

/**
 * מחיקת מבחן
 */
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'מבחן לא נמצא' });
    }

    // מחיקת כל הציונים של המבחן
    await Grade.deleteMany({ exam: exam._id });

    res.json({ message: 'מבחן נמחק בהצלחה' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ message: 'שגיאה במחיקת מבחן' });
  }
};

/**
 * שמירת/עדכון ציונים למבחן
 */
const saveGrades = async (req, res) => {
  try {
    const { examId } = req.params;
    const { grades } = req.body;

    if (!Array.isArray(grades)) {
      return res.status(400).json({ message: 'grades חייב להיות מערך' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'מבחן לא נמצא' });
    }

    const savedGrades = [];

    for (const gradeData of grades) {
      const { enrollmentId, score, notes } = gradeData;

      // חישוב אחוז
      const percentage = exam.maxScore > 0 ? Math.round((score / exam.maxScore) * 100) : 0;

      // עדכון או יצירה
      const grade = await Grade.findOneAndUpdate(
        { exam: examId, enrollment: enrollmentId },
        {
          score,
          percentage,
          notes: notes || '',
          gradedBy: req.user._id,
        },
        { new: true, upsert: true }
      );

      savedGrades.push(grade);
    }

    const populated = await Grade.find({ exam: examId })
      .populate({
        path: 'enrollment',
        populate: [
          { path: 'customer', select: 'name phone email' },
          { path: 'lead', select: 'name phone email' }
        ]
      })
      .populate('gradedBy', 'name email');

    res.json({
      message: 'ציונים נשמרו בהצלחה',
      grades: populated,
    });
  } catch (error) {
    console.error('Save grades error:', error);
    res.status(500).json({ message: 'שגיאה בשמירת ציונים' });
  }
};

module.exports = {
  getExamsByCourse,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  saveGrades,
};

const Attendance = require('../models/Attendance');
const CourseEnrollment = require('../models/CourseEnrollment');
const Course = require('../models/Course');

/**
 * קבלת נוכחות לקורס
 */
const getAttendanceByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { sessionNumber } = req.query;

    const query = { course: courseId };
    if (sessionNumber) {
      query.sessionNumber = parseInt(sessionNumber);
    }

    const attendanceRecords = await Attendance.find(query)
      .populate({
        path: 'attendees.enrollment',
        populate: [
          { path: 'customer', select: 'name phone email' },
          { path: 'lead', select: 'name phone email' }
        ]
      })
      .populate('recordedBy', 'name email')
      .sort({ sessionNumber: -1 });

    res.json({ attendance: attendanceRecords });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'שגיאה בקבלת נוכחות' });
  }
};

/**
 * יצירת/עדכון נוכחות למפגש
 */
const createOrUpdateAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { sessionNumber, sessionDate, attendees } = req.body;

    if (!sessionNumber || !sessionDate || !attendees || !Array.isArray(attendees)) {
      return res.status(400).json({ message: 'מספר מפגש, תאריך ומשתתפים הם שדות חובה' });
    }

    // בדיקה שהקורס קיים
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'קורס לא נמצא' });
    }

    // בדיקה/יצירת רשומת נוכחות
    let attendance = await Attendance.findOne({
      course: courseId,
      sessionNumber: parseInt(sessionNumber),
    });

    if (attendance) {
      // עדכון
      attendance.sessionDate = new Date(sessionDate);
      attendance.attendees = attendees;
      attendance.recordedBy = req.user._id;
      await attendance.save();
    } else {
      // יצירה
      attendance = await Attendance.create({
        course: courseId,
        sessionNumber: parseInt(sessionNumber),
        sessionDate: new Date(sessionDate),
        attendees,
        recordedBy: req.user._id,
      });
    }

    const populated = await Attendance.findById(attendance._id)
      .populate({
        path: 'attendees.enrollment',
        populate: [
          { path: 'customer', select: 'name phone email' },
          { path: 'lead', select: 'name phone email' }
        ]
      })
      .populate('recordedBy', 'name email');

    res.json({
      message: 'נוכחות נשמרה בהצלחה',
      attendance: populated,
    });
  } catch (error) {
    console.error('Create/update attendance error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'נוכחות למפגש זה כבר קיימת' });
    }
    res.status(500).json({ message: 'שגיאה בשמירת נוכחות' });
  }
};

/**
 * קבלת מפגשים מתוכננים לקורס
 */
const getCourseSessions = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: 'קורס לא נמצא' });
    }

    if (!course.startDate || !course.numberOfSessions || !course.dayOfWeek) {
      return res.json({ sessions: [] });
    }

    // חישוב תאריכי מפגשים
    const sessions = [];
    const startDate = new Date(course.startDate);
    const dayOfWeekMap = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    const targetDay = dayOfWeekMap[course.dayOfWeek];

    // מציאת היום הראשון של השבוע
    let currentDate = new Date(startDate);
    while (currentDate.getDay() !== targetDay) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const holidays = course.holidays || [];
    let sessionNum = 1;

    while (sessionNum <= course.numberOfSessions) {
      // דילוג על חופשים
      const isHoliday = holidays.some(holiday => {
        const hDate = new Date(holiday);
        return hDate.toDateString() === currentDate.toDateString();
      });

      if (!isHoliday) {
        sessions.push({
          sessionNumber: sessionNum,
          date: new Date(currentDate),
        });
        sessionNum++;
      }

      // מעבר לשבוע הבא
      currentDate.setDate(currentDate.getDate() + 7);
    }

    // חישוב המפגש הנוכחי
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentSession = null;
    let nextSession = null;

    for (let i = 0; i < sessions.length; i++) {
      const sessionDate = new Date(sessions[i].date);
      sessionDate.setHours(0, 0, 0, 0);

      if (sessionDate.getTime() === today.getTime()) {
        currentSession = sessions[i].sessionNumber;
      } else if (sessionDate > today && !nextSession) {
        nextSession = sessions[i].sessionNumber;
      }
    }

    res.json({
      sessions,
      currentSession,
      nextSession,
      totalSessions: course.numberOfSessions,
    });
  } catch (error) {
    console.error('Get course sessions error:', error);
    res.status(500).json({ message: 'שגיאה בחישוב מפגשים' });
  }
};

module.exports = {
  getAttendanceByCourse,
  createOrUpdateAttendance,
  getCourseSessions,
};

const Course = require('../models/Course');
const CourseEnrollment = require('../models/CourseEnrollment');
const Grade = require('../models/Grade');
const Exam = require('../models/Exam');
const Workshop = require('../models/Workshop');
const WorkshopEnrollment = require('../models/WorkshopEnrollment');

/**
 * Helper function לחישוב מפגשים של קורס
 */
function calculateCourseSessions(course) {
  if (!course.startDate || !course.numberOfSessions || !course.dayOfWeek) {
    return {
      sessions: [],
      currentSession: null,
      nextSession: null,
      upcomingSessions: [],
    };
  }

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentSession = null;
  let nextSession = null;
  const upcomingSessions = [];

  while (sessionNum <= course.numberOfSessions) {
    // דילוג על חופשים
    const isHoliday = holidays.some(holiday => {
      const hDate = new Date(holiday);
      hDate.setHours(0, 0, 0, 0);
      return hDate.getTime() === currentDate.getTime();
    });

    if (!isHoliday) {
      const sessionDate = new Date(currentDate);
      sessionDate.setHours(0, 0, 0, 0);

      sessions.push({
        sessionNumber: sessionNum,
        date: new Date(currentDate),
      });

      // מציאת מפגש נוכחי
      if (sessionDate.getTime() === today.getTime()) {
        currentSession = sessionNum;
      }

      // מציאת מפגש הבא
      if (sessionDate > today && !nextSession) {
        nextSession = sessionNum;
      }

      // מפגשים הבאים (עד 5)
      if (sessionDate > today && upcomingSessions.length < 5) {
        upcomingSessions.push({
          sessionNumber: sessionNum,
          date: new Date(currentDate),
        });
      }

      sessionNum++;
    }

    // מעבר לשבוע הבא
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return {
    sessions,
    currentSession,
    nextSession,
    upcomingSessions,
  };
}

/**
 * קבלת קורסים של התלמיד
 */
const getStudentCourses = async (req, res) => {
  try {
    const customerId = req.student._id;

    // מציאת כל ההרשמות של התלמיד (רק approved/enrolled)
    const enrollments = await CourseEnrollment.find({
      customer: customerId,
      status: { $in: ['approved', 'enrolled'] },
    })
      .populate({
        path: 'course',
        populate: {
          path: 'instructor',
          select: 'name email phone',
        },
      })
      .sort({ enrolledAt: -1 });

    // עיבוד הקורסים עם מידע נוסף
    const courses = enrollments.map(enrollment => {
      const course = enrollment.course;
      if (!course) return null;

      const sessionInfo = calculateCourseSessions(course);

      return {
        enrollmentId: enrollment._id,
        course: {
          id: course._id,
          name: course.name,
          subject: course.subject,
          instructor: course.instructor,
          startDate: course.startDate,
          endDate: course.endDate,
          location: course.location,
          syllabus: course.syllabus,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          currentSession: sessionInfo.currentSession,
          nextSession: sessionInfo.nextSession,
          totalSessions: course.numberOfSessions,
          upcomingSessions: sessionInfo.upcomingSessions,
        },
      };
    }).filter(Boolean);

    res.json({ courses });
  } catch (error) {
    console.error('Get student courses error:', error?.message || error);
    if (error?.stack) console.error(error.stack);
    res.status(500).json({ message: 'שגיאה בקבלת קורסים' });
  }
};

/**
 * קבלת פרטי קורס ספציפי עם סילבוס ומפגשים
 */
const getStudentCourseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.student._id;

    // בדיקה שהתלמיד רשום לקורס
    const enrollment = await CourseEnrollment.findOne({
      course: id,
      customer: customerId,
      status: { $in: ['approved', 'enrolled'] },
    })
      .populate({
        path: 'course',
        populate: {
          path: 'instructor',
          select: 'name email phone',
        },
      });

    if (!enrollment || !enrollment.course) {
      return res.status(404).json({ message: 'קורס לא נמצא או שאינך רשום אליו' });
    }

    const course = enrollment.course;
    const sessionInfo = calculateCourseSessions(course);

    // קבלת ציונים לקורס זה
    const grades = await Grade.find({ enrollment: enrollment._id })
      .populate({
        path: 'exam',
        select: 'name type date maxScore weight',
      })
      .sort({ 'exam.date': -1 });

    res.json({
      course: {
        id: course._id,
        name: course.name,
        subject: course.subject,
        description: course.description,
        instructor: course.instructor,
        startDate: course.startDate,
        endDate: course.endDate,
        location: course.location,
        syllabus: course.syllabus,
        numberOfSessions: course.numberOfSessions,
        dayOfWeek: course.dayOfWeek,
        requiredEquipment: course.requiredEquipment,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
      },
      sessions: sessionInfo.sessions,
      currentSession: sessionInfo.currentSession,
      nextSession: sessionInfo.nextSession,
      upcomingSessions: sessionInfo.upcomingSessions,
      grades: grades.map(grade => ({
        id: grade._id,
        exam: grade.exam,
        score: grade.score,
        percentage: grade.percentage,
        notes: grade.notes,
        gradedAt: grade.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get student course details error:', error);
    res.status(500).json({ message: 'שגיאה בקבלת פרטי קורס' });
  }
};

/**
 * קבלת כל הציונים של התלמיד
 */
const getStudentGrades = async (req, res) => {
  try {
    const customerId = req.student._id;

    // מציאת כל ההרשמות של התלמיד
    const enrollments = await CourseEnrollment.find({
      customer: customerId,
      status: { $in: ['approved', 'enrolled'] },
    });

    const enrollmentIds = enrollments.map(e => e._id);

    // קבלת כל הציונים
    const grades = await Grade.find({ enrollment: { $in: enrollmentIds } })
      .populate({
        path: 'exam',
        populate: {
          path: 'course',
          select: 'name subject',
        },
      })
      .populate({
        path: 'enrollment',
        select: 'status enrolledAt',
      })
      .sort({ 'exam.date': -1 });

    // ארגון לפי קורסים
    const gradesByCourse = {};
    grades.forEach(grade => {
      if (!grade.exam || !grade.exam.course) return; // דילוג על ציונים עם exam/course חסר
      const courseId = grade.exam.course._id.toString();
      if (!gradesByCourse[courseId]) {
        gradesByCourse[courseId] = {
          course: grade.exam.course,
          grades: [],
        };
      }
      gradesByCourse[courseId].grades.push({
        id: grade._id,
        exam: {
          id: grade.exam._id,
          name: grade.exam.name,
          type: grade.exam.type,
          date: grade.exam.date,
          maxScore: grade.exam.maxScore,
          weight: grade.exam.weight,
        },
        score: grade.score,
        percentage: grade.percentage,
        notes: grade.notes,
        gradedAt: grade.createdAt,
      });
    });

    // חישוב ממוצעים
    const summary = {
      totalExams: grades.length,
      averageScore: 0,
      averagePercentage: 0,
    };

    if (grades.length > 0) {
      const totalScore = grades.reduce((sum, g) => sum + (g.score || 0), 0);
      const totalPercentage = grades.reduce((sum, g) => sum + (g.percentage || 0), 0);
      summary.averageScore = Math.round((totalScore / grades.length) * 100) / 100;
      summary.averagePercentage = Math.round((totalPercentage / grades.length) * 100) / 100;
    }

    res.json({
      gradesByCourse: Object.values(gradesByCourse),
      summary,
    });
  } catch (error) {
    console.error('Get student grades error:', error?.message || error);
    if (error?.stack) console.error(error.stack);
    res.status(500).json({ message: 'שגיאה בקבלת ציונים' });
  }
};

/**
 * קבלת ציונים לקורס ספציפי
 */
const getStudentGradesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const customerId = req.student._id;

    // בדיקה שהתלמיד רשום לקורס
    const enrollment = await CourseEnrollment.findOne({
      course: courseId,
      customer: customerId,
      status: { $in: ['approved', 'enrolled'] },
    })
      .populate('course', 'name subject');

    if (!enrollment) {
      return res.status(404).json({ message: 'קורס לא נמצא או שאינך רשום אליו' });
    }

    // קבלת ציונים
    const grades = await Grade.find({ enrollment: enrollment._id })
      .populate({
        path: 'exam',
        select: 'name type date maxScore weight description',
      })
      .sort({ 'exam.date': -1 });

    res.json({
      course: enrollment.course,
      grades: grades.map(grade => ({
        id: grade._id,
        exam: grade.exam,
        score: grade.score,
        percentage: grade.percentage,
        notes: grade.notes,
        gradedAt: grade.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get student grades by course error:', error);
    res.status(500).json({ message: 'שגיאה בקבלת ציונים' });
  }
};

/**
 * קבלת סדנאות מומלצות
 */
const getRecommendedWorkshops = async (req, res) => {
  try {
    const customerId = req.student._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // קבלת כל הסדנאות העתידיות
    const workshops = await Workshop.find({
      date: { $gte: today },
      isActive: true,
    })
      .populate('instructor', 'name email phone')
      .sort({ date: 1 })
      .limit(10);

    // בדיקה אילו סדנאות התלמיד כבר רשום אליהן
    const enrollments = await WorkshopEnrollment.find({
      customer: customerId,
      workshop: { $in: workshops.map(w => w._id) },
    });

    const enrolledWorkshopIds = new Set(enrollments.map(e => e.workshop.toString()));

    // עיבוד הסדנאות
    const recommendedWorkshops = workshops.map(workshop => {
      const enrollment = enrollments.find(e => e.workshop.toString() === workshop._id.toString());
      return {
        id: workshop._id,
        name: workshop.name,
        instructor: workshop.instructor,
        date: workshop.date,
        duration: workshop.duration,
        price: workshop.price,
        capacity: workshop.capacity,
        description: workshop.description,
        location: workshop.location,
        isEnrolled: enrolledWorkshopIds.has(workshop._id.toString()),
        enrollmentStatus: enrollment?.status,
      };
    });

    res.json({ workshops: recommendedWorkshops });
  } catch (error) {
    console.error('Get recommended workshops error:', error?.message || error);
    if (error?.stack) console.error(error.stack);
    res.status(500).json({ message: 'שגיאה בקבלת סדנאות מומלצות' });
  }
};

module.exports = {
  getStudentCourses,
  getStudentCourseDetails,
  getStudentGrades,
  getStudentGradesByCourse,
  getRecommendedWorkshops,
};

const Course = require('../models/Course');
const CourseEnrollment = require('../models/CourseEnrollment');

const getCourses = async (req, res) => {
  try {
    const { subject, instructor, startDate, endDate, search } = req.query;
    const query = {};

    if (subject) query.subject = subject;
    if (instructor) query.instructor = instructor;
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const courses = await Course.find(query)
      .populate('instructor', 'name email')
      .populate('additionalStaff', 'name email')
      .sort({ startDate: -1 });

    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת קורסים' });
  }
};

const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('additionalStaff', 'name email phone');

    if (!course) {
      return res.status(404).json({ message: 'קורס לא נמצא' });
    }

    const enrollments = await CourseEnrollment.find({ course: course._id })
      .populate('customer', 'name email phone')
      .populate('lead', 'name phone email')
      .sort({ enrolledAt: -1 });

    // הוספת paymentId ממתין לכל enrollment
    const Payment = require('../models/Payment');
    for (const enrollment of enrollments) {
      if (enrollment.customer && enrollment.status === 'pending') {
        const pendingPayment = await Payment.findOne({
          enrollmentId: enrollment._id,
          enrollmentType: 'CourseEnrollment',
          status: 'pending',
        }).sort({ paymentIndex: 1 });

        if (pendingPayment) {
          enrollment.pendingPaymentId = pendingPayment._id;
        }
      }
    }

    // חישוב התקדמות הקורס
    let currentSession = null;
    let progressInfo = null;

    if (course.startDate && course.numberOfSessions && course.dayOfWeek) {
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
      const startDate = new Date(course.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // מציאת היום הראשון של השבוע
      let currentDate = new Date(startDate);
      while (currentDate.getDay() !== targetDay) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const holidays = course.holidays || [];
      let sessionNum = 1;
      let foundCurrent = false;

      while (sessionNum <= course.numberOfSessions && !foundCurrent) {
        const isHoliday = holidays.some(holiday => {
          const hDate = new Date(holiday);
          hDate.setHours(0, 0, 0, 0);
          return hDate.getTime() === currentDate.getTime();
        });

        if (!isHoliday) {
          const sessionDate = new Date(currentDate);
          sessionDate.setHours(0, 0, 0, 0);

          if (sessionDate.getTime() <= today.getTime()) {
            currentSession = sessionNum;
          }

          if (sessionDate.getTime() <= today.getTime() || !foundCurrent) {
            sessionNum++;
          } else {
            foundCurrent = true;
          }
        }

        if (!foundCurrent) {
          currentDate.setDate(currentDate.getDate() + 7);
        }
      }

      progressInfo = {
        currentSession: currentSession || 0,
        totalSessions: course.numberOfSessions,
        progress: currentSession ? Math.round((currentSession / course.numberOfSessions) * 100) : 0,
      };
    }

    res.json({ course, enrollments, progressInfo });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת קורס' });
  }
};

const createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ message: 'קורס נוצר בהצלחה', course });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה ביצירת קורס' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('instructor', 'name email');

    if (!course) {
      return res.status(404).json({ message: 'קורס לא נמצא' });
    }

    res.json({ message: 'קורס עודכן בהצלחה', course });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בעדכון קורס' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'קורס לא נמצא' });
    }
    await CourseEnrollment.deleteMany({ course: course._id });
    res.json({ message: 'קורס נמחק בהצלחה' });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה במחיקת קורס' });
  }
};

const enrollInCourse = async (req, res) => {
  try {
    const { customerId, leadId, leadData, notes, paymentMethod, numberOfPayments, paymentPlan } = req.body;
    const courseId = req.params.id;

    let finalCustomerId = customerId && customerId.trim() !== '' ? customerId : null;
    let finalLeadId = leadId && leadId.trim() !== '' ? leadId : null;

    // אם נוצר ליד חדש
    if (leadData && !finalLeadId && !finalCustomerId) {
      const Lead = require('../models/Lead');
      const newLead = await Lead.create({
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        source: leadData.source || 'other',
      });
      finalLeadId = newLead._id;
    }

    if (!finalCustomerId && !finalLeadId) {
      return res.status(400).json({ message: 'נדרש לקוח או ליד' });
    }

    // קבלת פרטי הקורס
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'קורס לא נמצא' });
    }

    // יצירת השיוך במצב pending
    const enrollment = await CourseEnrollment.create({
      course: courseId,
      customer: finalCustomerId || undefined,
      lead: finalLeadId || undefined,
      notes: notes || '',
      status: 'pending',
      paymentStatus: 'pending',
    });

    // יצירת תשלום אוטומטי - רק אם יש לקוח (לא ליד)
    if (finalCustomerId) {
      const Payment = require('../models/Payment');
      const totalAmount = course.price || 0;
      const paymentsCount = numberOfPayments || 1;
      const amountPerPayment = totalAmount / paymentsCount;

      // יצירת תשלומים
      const payments = [];
      for (let i = 0; i < paymentsCount; i++) {
        const payment = await Payment.create({
          customer: finalCustomerId,
          amount: amountPerPayment,
          currency: 'ILS',
          paymentMethod: paymentMethod || 'credit_card',
          paymentDate: new Date(),
          description: `תשלום ${i + 1}/${paymentsCount} עבור קורס: ${course.name}`,
          relatedTo: {
            type: 'course',
            id: courseId,
          },
          enrollmentId: enrollment._id,
          enrollmentType: 'CourseEnrollment',
          paymentIndex: i + 1,
          numberOfPayments: paymentsCount,
          paymentPlan: paymentPlan || 'single',
          status: i === 0 ? 'pending' : 'pending', // הראשון pending, השאר pending
          recordedBy: req.user._id,
        });
        payments.push(payment);
      }
    }

    res.status(201).json({
      message: 'נרשם לקורס בהצלחה',
      enrollment,
      requiresPayment: !!finalCustomerId,
    });
  } catch (error) {
    console.error('Enroll course error:', error);
    res.status(500).json({
      message: 'שגיאה ברישום לקורס',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const removeEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const enrollment = await CourseEnrollment.findById(enrollmentId);

    if (!enrollment) {
      return res.status(404).json({ message: 'הרשמה לא נמצאה' });
    }

    // מחיקת תשלומים קשורים
    const Payment = require('../models/Payment');
    await Payment.deleteMany({ enrollmentId: enrollment._id });

    // מחיקת ההרשמה
    await CourseEnrollment.findByIdAndDelete(enrollmentId);

    res.json({ message: 'המשתתף הוסר מהקורס בהצלחה' });
  } catch (error) {
    console.error('Remove enrollment error:', error);
    res.status(500).json({
      message: 'שגיאה בהסרת משתתף',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  removeEnrollment,
};

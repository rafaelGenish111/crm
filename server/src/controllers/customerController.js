const Customer = require('../models/Customer');
const CustomerInteraction = require('../models/CustomerInteraction');
const Payment = require('../models/Payment');

/**
 * קבלת כל הלקוחות
 */
const getCustomers = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const customers = await Customer.find(query)
      .populate('convertedFromLead', 'name phone')
      .sort({ createdAt: -1 });

    res.json({ customers });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'שגיאה בקבלת לקוחות' });
  }
};

/**
 * קבלת לקוח לפי ID
 */
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('convertedFromLead', 'name phone email');

    if (!customer) {
      return res.status(404).json({ message: 'לקוח לא נמצא' });
    }

    // קבלת אינטראקציות
    const interactions = await CustomerInteraction.find({ customer: customer._id })
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 });

    // קבלת תשלומים
    const payments = await Payment.find({ customer: customer._id })
      .populate('recordedBy', 'name')
      .sort({ paymentDate: -1 });

    // חישוב סיכום שווי
    const totalValue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    // קבלת הרשמות לקורסים
    const CourseEnrollment = require('../models/CourseEnrollment');
    const courseEnrollments = await CourseEnrollment.find({ customer: customer._id })
      .populate('course', 'name subject instructor price')
      .populate('course.instructor', 'name')
      .sort({ enrolledAt: -1 });

    // הוספת paymentId ממתין לכל enrollment
    for (const enrollment of courseEnrollments) {
      if (enrollment.status === 'pending') {
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

    // קבלת הרשמות לסדנאות
    const WorkshopEnrollment = require('../models/WorkshopEnrollment');
    const workshopEnrollments = await WorkshopEnrollment.find({ customer: customer._id })
      .populate('workshop', 'name instructor date price location')
      .populate('workshop.instructor', 'name')
      .sort({ enrolledAt: -1 });

    res.json({
      customer,
      interactions,
      payments,
      totalValue,
      courseEnrollments,
      workshopEnrollments,
    });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת לקוח' });
  }
};

/**
 * יצירת סיסמה ראשונית אקראית
 */
function generateInitialPassword() {
  // יצירת סיסמה אקראית של 8 תווים (מספרים ואותיות)
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * יצירת לקוח חדש
 */
const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, source, notes, initialPassword } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'שם וטלפון הם שדות חובה' });
    }

    // יצירת סיסמה ראשונית אם לא סופקה
    const finalInitialPassword = initialPassword || generateInitialPassword();

    // יצירת username ייחודי (אימייל או טלפון)
    let username = email || phone;

    // בדיקה ש-username לא קיים
    let existingCustomer = await Customer.findOne({ username });
    let counter = 1;
    while (existingCustomer) {
      username = `${email || phone}_${counter}`;
      existingCustomer = await Customer.findOne({ username });
      counter++;
    }

    const customer = await Customer.create({
      name,
      email,
      phone,
      source: source || 'direct',
      notes,
      username,
      initialPassword: finalInitialPassword,
      passwordChanged: false,
    });

    res.status(201).json({
      message: 'לקוח נוצר בהצלחה',
      customer: {
        ...customer.toJSON(),
        initialPassword: finalInitialPassword, // החזרת הסיסמה הראשונית רק ביצירה
      },
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'שגיאה ביצירת לקוח' });
  }
};

/**
 * עדכון לקוח
 */
const updateCustomer = async (req, res) => {
  try {
    const { name, email, phone, notes, isActive, initialPassword } = req.body;
    const updateData = {
      name,
      email,
      phone,
      notes,
      isActive,
    };

    // אם admin מעדכן סיסמה ראשונית
    if (initialPassword) {
      updateData.initialPassword = initialPassword;
      updateData.passwordChanged = false;
      // איפוס הסיסמה המוצפנת
      updateData.password = undefined;
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ message: 'לקוח לא נמצא' });
    }

    res.json({
      message: 'לקוח עודכן בהצלחה',
      customer,
    });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בעדכון לקוח' });
  }
};

/**
 * מחיקת לקוח
 */
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'לקוח לא נמצא' });
    }

    // מחיקת אינטראקציות ותשלומים קשורים
    await CustomerInteraction.deleteMany({ customer: customer._id });
    await Payment.deleteMany({ customer: customer._id });

    res.json({ message: 'לקוח נמחק בהצלחה' });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה במחיקת לקוח' });
  }
};

/**
 * איפוס סיסמה ראשונית של לקוח (על ידי אדמין)
 */
const resetCustomerPassword = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('+initialPassword');

    if (!customer) {
      return res.status(404).json({ message: 'לקוח לא נמצא' });
    }

    // יצירת סיסמה ראשונית חדשה
    const newInitialPassword = generateInitialPassword();

    // עדכון סיסמה ראשונית חדשה
    customer.initialPassword = newInitialPassword;
    customer.password = undefined; // איפוס סיסמה רגילה
    customer.passwordChanged = false; // איפוס סטטוס שינוי סיסמה
    await customer.save();

    res.json({
      message: 'סיסמה אופסה בהצלחה',
      initialPassword: newInitialPassword,
    });
  } catch (error) {
    console.error('Reset customer password error:', error);
    res.status(500).json({ message: 'שגיאה באיפוס סיסמה' });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  resetCustomerPassword,
};

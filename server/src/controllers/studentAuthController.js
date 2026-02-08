const Customer = require('../models/Customer');
const { generateStudentToken } = require('../middleware/studentAuth');

/**
 * התחברות תלמיד
 */
const studentLogin = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: 'נא להזין סיסמה'
      });
    }

    // מציאת תלמיד לפי אימייל או טלפון
    let customer;
    if (email) {
      customer = await Customer.findOne({ email: email.toLowerCase() }).select('+password +initialPassword');
    } else if (phone) {
      customer = await Customer.findOne({ phone }).select('+password +initialPassword');
    } else {
      return res.status(400).json({
        message: 'נא להזין אימייל או טלפון'
      });
    }

    if (!customer) {
      return res.status(401).json({ message: 'אימייל/טלפון או סיסמה שגויים' });
    }

    if (!customer.isActive) {
      return res.status(401).json({ message: 'חשבון התלמיד מושבת' });
    }

    // בדיקת סיסמה ראשונית או סיסמה רגילה
    let isPasswordValid = false;
    if (customer.passwordChanged) {
      // אם הסיסמה שונתה, בדוק את הסיסמה המוצפנת
      isPasswordValid = await customer.comparePassword(password);
    } else {
      // אם הסיסמה לא שונתה, בדוק את הסיסמה הראשונית
      isPasswordValid = customer.compareInitialPassword(password);
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'אימייל/טלפון או סיסמה שגויים' });
    }

    // עדכון זמן התחברות אחרונה
    customer.lastLogin = new Date();
    await customer.save({ validateBeforeSave: false });

    // יצירת token
    const token = generateStudentToken(customer._id);

    res.json({
      message: 'התחברות הצליחה',
      token,
      student: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        passwordChanged: customer.passwordChanged,
      },
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'שגיאה בהתחברות' });
  }
};

/**
 * שינוי סיסמה
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const customer = req.student;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'נא להזין סיסמה נוכחית וסיסמה חדשה'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'סיסמה חדשה חייבת להכיל לפחות 6 תווים'
      });
    }

    // בדיקת סיסמה נוכחית
    let isCurrentPasswordValid = false;
    if (customer.passwordChanged) {
      // אם הסיסמה שונתה, בדוק את הסיסמה המוצפנת
      isCurrentPasswordValid = await customer.comparePassword(currentPassword);
    } else {
      // אם הסיסמה לא שונתה, בדוק את הסיסמה הראשונית
      isCurrentPasswordValid = customer.compareInitialPassword(currentPassword);
    }

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: 'סיסמה נוכחית שגויה' });
    }

    // עדכון סיסמה
    customer.password = newPassword;
    customer.passwordChanged = true;
    customer.initialPassword = undefined; // מחיקת סיסמה ראשונית
    await customer.save();

    res.json({
      message: 'סיסמה עודכנה בהצלחה'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'שגיאה בשינוי סיסמה' });
  }
};

/**
 * קבלת פרופיל תלמיד
 */
const getStudentProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.student._id)
      .select('+initialPassword');

    if (!customer) {
      return res.status(404).json({ message: 'תלמיד לא נמצא' });
    }

    // החזרת פרופיל עם הסיסמה הראשונית רק אם היא עדיין לא שונתה
    const studentData = customer.toObject();
    if (customer.passwordChanged) {
      delete studentData.initialPassword;
    }

    res.json({
      student: studentData,
    });
  } catch (error) {
    console.error('Get student profile error:', error?.message || error);
    if (error?.stack) console.error(error.stack);
    res.status(500).json({ message: 'שגיאה בקבלת פרופיל תלמיד' });
  }
};

/**
 * איפוס סיסמה - יצירת סיסמה ראשונית חדשה (על ידי תלמיד מחובר)
 */
const resetPassword = async (req, res) => {
  try {
    const customer = await Customer.findById(req.student._id);

    if (!customer) {
      return res.status(404).json({ message: 'תלמיד לא נמצא' });
    }

    // יצירת סיסמה ראשונית חדשה
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let newInitialPassword = '';
    for (let i = 0; i < 8; i++) {
      newInitialPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

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
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'שגיאה באיפוס סיסמה' });
  }
};

/**
 * איפוס סיסמה ראשונית לפי אימייל/טלפון (ללא אימות - ציבורי)
 */
const resetPasswordByEmailOrPhone = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        message: 'נא להזין אימייל או טלפון'
      });
    }

    // מציאת תלמיד לפי אימייל או טלפון
    let customer;
    if (email) {
      customer = await Customer.findOne({ email: email.toLowerCase() }).select('+initialPassword');
    } else {
      customer = await Customer.findOne({ phone }).select('+initialPassword');
    }

    if (!customer) {
      return res.status(404).json({ message: 'תלמיד לא נמצא' });
    }

    if (!customer.isActive) {
      return res.status(401).json({ message: 'חשבון התלמיד מושבת' });
    }

    // יצירת סיסמה ראשונית חדשה
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let newInitialPassword = '';
    for (let i = 0; i < 8; i++) {
      newInitialPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

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
    console.error('Reset password by email/phone error:', error);
    res.status(500).json({ message: 'שגיאה באיפוס סיסמה' });
  }
};

module.exports = {
  studentLogin,
  changePassword,
  getStudentProfile,
  resetPassword,
  resetPasswordByEmailOrPhone,
};

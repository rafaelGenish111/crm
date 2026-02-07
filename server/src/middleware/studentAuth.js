const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware לאימות תלמיד
 */
const authenticateStudent = async (req, res, next) => {
  try {
    // קבלת token מה-header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'לא מאומת. נדרש token.' });
    }

    const token = authHeader.substring(7); // הסרת "Bearer "

    // אימות token
    const decoded = jwt.verify(token, JWT_SECRET);

    // בדיקה אם זה token של תלמיד (יש customerId)
    if (!decoded.customerId) {
      return res.status(401).json({ message: 'Token לא תקין לתלמיד' });
    }

    // מציאת תלמיד
    const customer = await Customer.findById(decoded.customerId).select('+password');

    if (!customer) {
      return res.status(401).json({ message: 'תלמיד לא נמצא' });
    }

    if (!customer.isActive) {
      return res.status(401).json({ message: 'חשבון התלמיד מושבת' });
    }

    // הוספת תלמיד ל-request
    req.student = customer;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token לא תקין' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token פג תוקף' });
    }
    res.status(500).json({ message: 'שגיאה באימות' });
  }
};

/**
 * יצירת JWT token לתלמיד
 */
const generateStudentToken = (customerId) => {
  return jwt.sign({ customerId }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

module.exports = {
  authenticateStudent,
  generateStudentToken,
};

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware לאימות משתמש
 */
const authenticate = async (req, res, next) => {
  try {
    // קבלת token מה-header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'לא מאומת. נדרש token.' });
    }

    const token = authHeader.substring(7); // הסרת "Bearer "

    // אימות token
    const decoded = jwt.verify(token, JWT_SECRET);

    // מציאת משתמש
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'משתמש לא נמצא' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'חשבון המשתמש מושבת' });
    }

    // הוספת משתמש ל-request
    req.user = user;
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
 * יצירת JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = {
  authenticate,
  generateToken,
};

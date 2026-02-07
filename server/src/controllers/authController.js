const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

/**
 * התחברות משתמש
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'נא להזין אימייל וסיסמה'
      });
    }

    // מציאת משתמש עם סיסמה
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'חשבון המשתמש מושבת' });
    }

    // בדיקת סיסמה
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
    }

    // עדכון זמן התחברות אחרונה
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // יצירת token
    const token = generateToken(user._id);

    res.json({
      message: 'התחברות הצליחה',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'שגיאה בהתחברות' });
  }
};

/**
 * הרשמה משתמש חדש
 */
const signup = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'נא למלא את כל השדות הנדרשים'
      });
    }

    // בדיקה אם משתמש כבר קיים
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'משתמש עם אימייל זה כבר קיים' });
    }

    // יצירת משתמש חדש
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'admin_staff',
    });

    // יצירת token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'הרשמה הצליחה',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'משתמש עם אימייל זה כבר קיים' });
    }
    res.status(500).json({ message: 'שגיאה בהרשמה' });
  }
};

/**
 * קבלת פרטי משתמש נוכחי
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת פרטי משתמש' });
  }
};

module.exports = {
  login,
  signup,
  getMe,
};

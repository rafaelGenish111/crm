const User = require('../models/User');

/**
 * קבלת כל המשתמשים
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת משתמשים' });
  }
};

/**
 * קבלת משתמש לפי ID
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת משתמש' });
  }
};

/**
 * יצירת משתמש חדש
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'נא למלא את כל השדות הנדרשים'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'משתמש עם אימייל זה כבר קיים' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'admin_staff',
    });

    res.status(201).json({
      message: 'משתמש נוצר בהצלחה',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'משתמש עם אימייל זה כבר קיים' });
    }
    res.status(500).json({ message: 'שגיאה ביצירת משתמש' });
  }
};

/**
 * עדכון משתמש
 */
const updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, isActive } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    // בדיקה אם אימייל כבר קיים אצל משתמש אחר
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'משתמש עם אימייל זה כבר קיים' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      message: 'משתמש עודכן בהצלחה',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'שגיאה בעדכון משתמש' });
  }
};

/**
 * מחיקת משתמש
 */
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // לא ניתן למחוק את עצמך
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'לא ניתן למחוק את המשתמש הנוכחי' });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    res.json({ message: 'משתמש נמחק בהצלחה' });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה במחיקת משתמש' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};

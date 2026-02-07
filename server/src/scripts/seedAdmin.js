require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');

const createAdminUser = async () => {
  try {
    // Connect to database
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@crm.com' });

    if (existingAdmin) {
      console.log('✅ משתמש מנהל כבר קיים:');
      console.log('   אימייל: admin@crm.com');
      console.log('   סיסמה: admin123');
      console.log('\n💡 אם שכחת את הסיסמה, מחק את המשתמש מהמסד נתונים והרץ את הסקריפט שוב.');
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      name: 'מנהל ראשי',
      email: 'admin@crm.com',
      password: 'admin123',
      role: 'super_admin',
      phone: '050-1234567',
      isActive: true,
    });

    // Save with validation but the pre-save hook will hash the password
    await admin.save();

    console.log('✅ משתמש מנהל נוצר בהצלחה!');
    console.log('\n📋 פרטי התחברות:');
    console.log('   אימייל: admin@crm.com');
    console.log('   סיסמה: admin123');
    console.log('   תפקיד: Super Admin');
    console.log('\n⚠️  חשוב: שנה את הסיסמה אחרי ההתחברות הראשונה!');

    process.exit(0);
  } catch (error) {
    console.error('❌ שגיאה ביצירת משתמש מנהל:', error);
    process.exit(1);
  }
};

createAdminUser();

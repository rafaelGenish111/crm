require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');

// קבלת פרמטרים מהפקודה או שימוש בערכי ברירת מחדל
const args = process.argv.slice(2);
const email = args[0] || 'superadmin@crm.com';
const password = args[1] || 'SuperAdmin123!';
const name = args[2] || 'סופר אדמין';
const phone = args[3] || '050-0000000';

const createSuperAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log(`⚠️  משתמש עם אימייל ${email} כבר קיים!`);
      console.log(`   תפקיד נוכחי: ${existingUser.role}`);

      // אם המשתמש קיים אבל לא super_admin, נשאל אם לעדכן
      if (existingUser.role !== 'super_admin') {
        console.log(`\n💡 כדי לעדכן את התפקיד ל-super_admin, מחק את המשתמש והרץ את הסקריפט שוב.`);
      }
      process.exit(0);
    }

    // Create super admin user
    const superAdmin = new User({
      name,
      email,
      password,
      role: 'super_admin',
      phone,
      isActive: true,
    });

    // Save with validation but the pre-save hook will hash the password
    await superAdmin.save();

    console.log('✅ משתמש סופר אדמין נוצר בהצלחה!');
    console.log('\n📋 פרטי התחברות:');
    console.log(`   שם: ${name}`);
    console.log(`   אימייל: ${email}`);
    console.log(`   סיסמה: ${password}`);
    console.log(`   טלפון: ${phone}`);
    console.log(`   תפקיד: Super Admin`);
    console.log('\n⚠️  חשוב: שנה את הסיסמה אחרי ההתחברות הראשונה!');
    console.log('\n💡 שימוש:');
    console.log('   node src/scripts/createSuperAdmin.js [email] [password] [name] [phone]');
    console.log('   דוגמה: node src/scripts/createSuperAdmin.js admin@test.com MyPass123 מנהל 050-1234567');

    process.exit(0);
  } catch (error) {
    console.error('❌ שגיאה ביצירת משתמש סופר אדמין:', error.message);
    if (error.code === 11000) {
      console.error('   אימייל זה כבר קיים במערכת');
    }
    process.exit(1);
  }
};

createSuperAdmin();

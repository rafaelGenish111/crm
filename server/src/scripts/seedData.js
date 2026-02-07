require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

const User = require('../models/User');
const Customer = require('../models/Customer');
const Course = require('../models/Course');
const Workshop = require('../models/Workshop');
const CourseEnrollment = require('../models/CourseEnrollment');
const WorkshopEnrollment = require('../models/WorkshopEnrollment');
const Exam = require('../models/Exam');
const Grade = require('../models/Grade');

// פונקציה ליצירת סיסמה ראשונית
function generateInitialPassword() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// פונקציה ליצירת username ייחודי
async function generateUniqueUsername(baseUsername, CustomerModel) {
  let username = baseUsername;
  let counter = 1;
  let existing = await CustomerModel.findOne({ username });

  while (existing) {
    username = `${baseUsername}_${counter}`;
    existing = await CustomerModel.findOne({ username });
    counter++;
  }

  return username;
}

const seedData = async () => {
  try {
    // התחברות למסד נתונים
    await connectDB();

    console.log('🌱 מתחיל ליצור נתוני דמו...\n');

    // ניקוי נתונים קיימים (אופציונלי - ניתן להסיר)
    const clearExisting = process.argv.includes('--clear');
    if (clearExisting) {
      console.log('🗑️  מנקה נתונים קיימים...');
      await Grade.deleteMany({});
      await Exam.deleteMany({});
      await WorkshopEnrollment.deleteMany({});
      await CourseEnrollment.deleteMany({});
      await Workshop.deleteMany({});
      await Course.deleteMany({});
      await Customer.deleteMany({});
      await User.deleteMany({ role: { $in: ['instructor'] } });
      console.log('✅ נתונים קיימים נמחקו\n');
    }

    // 1. יצירת מנחים (Instructors)
    console.log('👨‍🏫 יוצר מנחים...');
    const instructors = [];

    const instructorData = [
      {
        name: 'ד״ר יוסי כהן',
        email: 'yossi.cohen@example.com',
        password: 'instructor123',
        role: 'instructor',
        phone: '050-1111111',
      },
      {
        name: 'פרופ׳ שרה לוי',
        email: 'sara.levi@example.com',
        password: 'instructor123',
        role: 'instructor',
        phone: '050-2222222',
      },
      {
        name: 'ד״ר משה דוד',
        email: 'moshe.david@example.com',
        password: 'instructor123',
        role: 'instructor',
        phone: '050-3333333',
      },
    ];

    for (const instructorInfo of instructorData) {
      let instructor = await User.findOne({ email: instructorInfo.email });
      if (!instructor) {
        instructor = new User(instructorInfo);
        await instructor.save();
      }
      instructors.push(instructor);
      console.log(`   ✅ ${instructor.name} - ${instructor.email}`);
    }

    // 2. יצירת משתתפים (Students/Customers)
    console.log('\n👥 יוצר משתתפים...');
    const students = [];

    const studentData = [
      {
        name: 'אבי ישראלי',
        email: 'avi.israeli@example.com',
        phone: '052-1234567',
        source: 'direct',
      },
      {
        name: 'מיכל כהן',
        email: 'michal.cohen@example.com',
        phone: '052-2345678',
        source: 'referral',
      },
      {
        name: 'דני לוי',
        email: 'dani.levi@example.com',
        phone: '052-3456789',
        source: 'direct',
      },
      {
        name: 'שרה דוד',
        email: 'sara.david@example.com',
        phone: '052-4567890',
        source: 'direct',
      },
      {
        name: 'יוסי מזרחי',
        email: 'yossi.mizrahi@example.com',
        phone: '052-5678901',
        source: 'referral',
      },
      {
        name: 'רונית אברהם',
        email: 'ronit.avraham@example.com',
        phone: '052-6789012',
        source: 'direct',
      },
      {
        name: 'עמית רוזן',
        email: 'amit.rozen@example.com',
        phone: '052-7890123',
        source: 'direct',
      },
      {
        name: 'ליאור כהן',
        email: 'lior.cohen@example.com',
        phone: '052-8901234',
        source: 'referral',
      },
    ];

    for (const studentInfo of studentData) {
      let student = await Customer.findOne({
        $or: [
          { email: studentInfo.email },
          { phone: studentInfo.phone }
        ]
      });

      if (!student) {
        const initialPassword = generateInitialPassword();
        const username = await generateUniqueUsername(
          studentInfo.email || studentInfo.phone,
          Customer
        );

        student = new Customer({
          ...studentInfo,
          username,
          initialPassword,
          passwordChanged: false,
          isActive: true,
        });
        await student.save();
        console.log(`   ✅ ${student.name} - ${student.email || student.phone}`);
        console.log(`      סיסמה ראשונית: ${initialPassword}`);
      } else {
        console.log(`   ℹ️  ${student.name} כבר קיים`);
      }
      students.push(student);
    }

    // 3. יצירת קורסים
    console.log('\n📚 יוצר קורסים...');
    const courses = [];

    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const courseData = [
      {
        name: 'מבוא למדעי המחשב',
        subject: 'מדעי המחשב',
        instructor: instructors[0]._id,
        startDate: nextWeek,
        endDate: new Date(nextWeek.getTime() + 90 * 24 * 60 * 60 * 1000), // 90 ימים
        price: 2500,
        capacity: 30,
        description: 'קורס בסיסי במדעי המחשב הכולל תכנות, מבני נתונים ואלגוריתמים',
        numberOfSessions: 12,
        dayOfWeek: 'sunday',
        location: 'כיתה 101',
        requiredEquipment: ['מחשב נייד', 'מחברת'],
        syllabus: `סילבוס קורס מבוא למדעי המחשב:

מפגש 1: מבוא לתכנות
- מה זה תכנות?
- סביבת פיתוח
- משתנים וסוגי נתונים

מפגש 2: תנאים ולולאות
- if/else
- for/while loops
- דוגמאות מעשיות

מפגש 3: פונקציות
- הגדרת פונקציות
- פרמטרים וערכים מוחזרים
- רקורסיה

מפגש 4: מערכים ורשימות
- מערכים חד-ממדיים
- מערכים רב-ממדיים
- פעולות על מערכים

מפגש 5: מבני נתונים בסיסיים
- רשימות מקושרות
- מחסניות ותורים
- עצים בסיסיים

מפגש 6: אלגוריתמי מיון
- Bubble Sort
- Quick Sort
- Merge Sort

מפגש 7: אלגוריתמי חיפוש
- Linear Search
- Binary Search
- Hash Tables

מפגש 8: תכנות מונחה עצמים
- מחלקות ואובייקטים
- ירושה
- פולימורפיזם

מפגש 9: בסיסי נתונים
- SQL בסיסי
- יחסים בין טבלאות
- שאילתות

מפגש 10: פיתוח web בסיסי
- HTML/CSS
- JavaScript
- API בסיסי

מפגש 11: פרויקט מעשי
- בניית אפליקציה קטנה
- עבודה בצוותים

מפגש 12: סיכום ומבחן סיום
- חזרה על החומר
- מבחן סיום`,
      },
      {
        name: 'פיתוח Full Stack',
        subject: 'פיתוח תוכנה',
        instructor: instructors[1]._id,
        startDate: new Date(nextWeek.getTime() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(nextWeek.getTime() + 120 * 24 * 60 * 60 * 1000),
        price: 3500,
        capacity: 25,
        description: 'קורס מתקדם בפיתוח Full Stack עם React ו-Node.js',
        numberOfSessions: 16,
        dayOfWeek: 'tuesday',
        location: 'מעבדת מחשבים A',
        requiredEquipment: ['מחשב נייד', 'Node.js מותקן'],
        syllabus: `סילבוס קורס פיתוח Full Stack:

מפגש 1: מבוא ל-Full Stack
- מה זה Full Stack?
- טכנולוגיות מודרניות
- סביבת פיתוח

מפגש 2: HTML5 ו-CSS3 מתקדם
- Semantic HTML
- Flexbox ו-Grid
- Animations

מפגש 3: JavaScript ES6+
- Arrow Functions
- Destructuring
- Promises ו-Async/Await

מפגש 4: React - מבוא
- Components
- Props ו-State
- Hooks

מפגש 5: React - מתקדם
- Context API
- Custom Hooks
- Performance Optimization

מפגש 6: React Router
- Navigation
- Protected Routes
- Dynamic Routes

מפגש 7: State Management
- Redux/Context
- Middleware
- Best Practices

מפגש 8: Node.js בסיסי
- Express.js
- RESTful API
- Middleware

מפגש 9: מסדי נתונים
- MongoDB/Mongoose
- SQL/Sequelize
- ORM/ODM

מפגש 10: Authentication & Authorization
- JWT
- Password Hashing
- Security Best Practices

מפגש 11: Testing
- Unit Tests
- Integration Tests
- E2E Tests

מפגש 12: Deployment
- CI/CD
- Cloud Platforms
- Docker Basics

מפגש 13-15: פרויקט מעשי
- בניית אפליקציה מלאה
- עבודה בצוותים

מפגש 16: סיכום ומבחן סיום`,
      },
      {
        name: 'אבטחת מידע',
        subject: 'אבטחה',
        instructor: instructors[2]._id,
        startDate: new Date(nextWeek.getTime() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(nextWeek.getTime() + 105 * 24 * 60 * 60 * 1000),
        price: 4000,
        capacity: 20,
        description: 'קורס מקיף באבטחת מידע וסייבר',
        numberOfSessions: 14,
        dayOfWeek: 'wednesday',
        location: 'כיתה 205',
        requiredEquipment: ['מחשב נייד', 'Kali Linux'],
        syllabus: `סילבוס קורס אבטחת מידע:

מפגש 1: מבוא לאבטחת מידע
- מושגי יסוד
- איומים ופגיעויות
- עקרונות אבטחה

מפגש 2: הצפנה
- Symmetric Encryption
- Asymmetric Encryption
- Hash Functions

מפגש 3: Authentication & Authorization
- Passwords
- Multi-Factor Authentication
- OAuth

מפגש 4: Network Security
- Firewalls
- VPN
- SSL/TLS

מפגש 5: Web Security
- XSS
- SQL Injection
- CSRF

מפגש 6: Secure Coding
- Best Practices
- Code Review
- Static Analysis

מפגש 7: Penetration Testing
- Reconnaissance
- Scanning
- Exploitation

מפגש 8: Incident Response
- Detection
- Containment
- Recovery

מפגש 9: Compliance & Regulations
- GDPR
- ISO 27001
- Industry Standards

מפגש 10: Cloud Security
- AWS Security
- Azure Security
- Best Practices

מפגש 11: Mobile Security
- iOS Security
- Android Security
- App Security

מפגש 12: IoT Security
- Device Security
- Network Security
- Privacy

מפגש 13: פרויקט מעשי
- Security Audit
- Penetration Test

מפגש 14: סיכום ומבחן סיום`,
      },
    ];

    for (const courseInfo of courseData) {
      let course = await Course.findOne({ name: courseInfo.name });
      if (!course) {
        course = new Course(courseInfo);
        await course.save();
        console.log(`   ✅ ${course.name} - ${course.subject}`);
      } else {
        console.log(`   ℹ️  ${course.name} כבר קיים`);
      }
      courses.push(course);
    }

    // 4. יצירת סדנאות
    console.log('\n🎓 יוצר סדנאות...');
    const workshops = [];

    const workshopData = [
      {
        name: 'סדנת Git ו-GitHub',
        instructor: instructors[0]._id,
        date: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
        duration: 3,
        price: 300,
        capacity: 15,
        description: 'סדנה מעשית על שימוש ב-Git ו-GitHub לניהול קוד',
        location: 'מעבדת מחשבים B',
      },
      {
        name: 'סדנת Docker למתחילים',
        instructor: instructors[1]._id,
        date: new Date(nextWeek.getTime() + 10 * 24 * 60 * 60 * 1000),
        duration: 4,
        price: 400,
        capacity: 12,
        description: 'למדו כיצד להשתמש ב-Docker לניהול containers',
        location: 'מעבדת מחשבים A',
      },
      {
        name: 'סדנת אבטחת Web Applications',
        instructor: instructors[2]._id,
        date: new Date(nextWeek.getTime() + 17 * 24 * 60 * 60 * 1000),
        duration: 5,
        price: 500,
        capacity: 10,
        description: 'סדנה מתקדמת על אבטחת אפליקציות web',
        location: 'כיתה 205',
      },
      {
        name: 'סדנת React Hooks מתקדמים',
        instructor: instructors[0]._id,
        date: new Date(nextWeek.getTime() + 24 * 24 * 60 * 60 * 1000),
        duration: 3,
        price: 350,
        capacity: 18,
        description: 'למדו להשתמש ב-React Hooks בצורה מתקדמת',
        location: 'מעבדת מחשבים A',
      },
    ];

    for (const workshopInfo of workshopData) {
      let workshop = await Workshop.findOne({
        name: workshopInfo.name,
        date: workshopInfo.date
      });
      if (!workshop) {
        workshop = new Workshop(workshopInfo);
        await workshop.save();
        console.log(`   ✅ ${workshop.name} - ${workshop.date.toLocaleDateString('he-IL')}`);
      } else {
        console.log(`   ℹ️  ${workshop.name} כבר קיים`);
      }
      workshops.push(workshop);
    }

    // 5. יצירת הרשמות לקורסים
    console.log('\n📝 יוצר הרשמות לקורסים...');
    const enrollments = [];

    // כל תלמיד נרשם ל-2 קורסים
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const course1 = courses[i % courses.length];
      const course2 = courses[(i + 1) % courses.length];

      // הרשמה ראשונה - approved
      let enrollment1 = await CourseEnrollment.findOne({
        customer: student._id,
        course: course1._id,
      });
      if (!enrollment1) {
        enrollment1 = new CourseEnrollment({
          course: course1._id,
          customer: student._id,
          status: 'approved',
          paymentStatus: 'completed',
          enrolledAt: new Date(today.getTime() - (i + 1) * 24 * 60 * 60 * 1000),
        });
        await enrollment1.save();
        enrollments.push(enrollment1);
        console.log(`   ✅ ${student.name} נרשם ל-${course1.name} (${enrollment1.status})`);
      }

      // הרשמה שנייה - enrolled
      let enrollment2 = await CourseEnrollment.findOne({
        customer: student._id,
        course: course2._id,
      });
      if (!enrollment2) {
        enrollment2 = new CourseEnrollment({
          course: course2._id,
          customer: student._id,
          status: 'enrolled',
          paymentStatus: 'partial',
          enrolledAt: new Date(today.getTime() - (i + 2) * 24 * 60 * 60 * 1000),
        });
        await enrollment2.save();
        enrollments.push(enrollment2);
        console.log(`   ✅ ${student.name} נרשם ל-${course2.name} (${enrollment2.status})`);
      }
    }

    // 6. יצירת הרשמות לסדנאות
    console.log('\n🎫 יוצר הרשמות לסדנאות...');
    for (let i = 0; i < students.length && i < workshops.length * 2; i++) {
      const student = students[i];
      const workshop = workshops[i % workshops.length];

      let workshopEnrollment = await WorkshopEnrollment.findOne({
        customer: student._id,
        workshop: workshop._id,
      });
      if (!workshopEnrollment) {
        workshopEnrollment = new WorkshopEnrollment({
          workshop: workshop._id,
          customer: student._id,
          status: i % 3 === 0 ? 'attended' : 'enrolled',
          enrolledAt: new Date(today.getTime() - (i + 1) * 24 * 60 * 60 * 1000),
        });
        await workshopEnrollment.save();
        console.log(`   ✅ ${student.name} נרשם ל-${workshop.name} (${workshopEnrollment.status})`);
      }
    }

    // 7. יצירת מבחנים
    console.log('\n📋 יוצר מבחנים...');
    const exams = [];

    for (const course of courses) {
      const examTypes = ['exam', 'quiz', 'assignment'];
      const examNames = [
        ['מבחן אמצע', 'בוחן 1', 'מטלה 1'],
        ['מבחן סיום', 'בוחן 2', 'מטלה 2'],
      ];

      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 3; j++) {
          const examDate = new Date(course.startDate.getTime() + (i * 45 + j * 15) * 24 * 60 * 60 * 1000);

          let exam = await Exam.findOne({
            course: course._id,
            name: examNames[i][j],
          });

          if (!exam) {
            exam = new Exam({
              course: course._id,
              name: examNames[i][j],
              type: examTypes[j],
              date: examDate,
              maxScore: examTypes[j] === 'exam' ? 100 : examTypes[j] === 'quiz' ? 20 : 50,
              weight: examTypes[j] === 'exam' ? 40 : examTypes[j] === 'quiz' ? 10 : 20,
              description: `${examNames[i][j]} בקורס ${course.name}`,
              createdBy: course.instructor,
            });
            await exam.save();
            exams.push(exam);
            console.log(`   ✅ ${exam.name} - ${course.name} (${exam.type})`);
          }
        }
      }
    }

    // 8. יצירת ציונים
    console.log('\n📊 יוצר ציונים...');
    let gradesCount = 0;

    for (const enrollment of enrollments) {
      const courseExams = exams.filter(e => e.course.toString() === enrollment.course.toString());

      // יצירת ציונים ל-50% מהמבחנים
      for (let i = 0; i < Math.floor(courseExams.length / 2); i++) {
        const exam = courseExams[i];

        let grade = await Grade.findOne({
          exam: exam._id,
          enrollment: enrollment._id,
        });

        if (!grade) {
          const score = Math.floor(Math.random() * (exam.maxScore * 0.4)) + exam.maxScore * 0.6; // 60-100%
          const percentage = (score / exam.maxScore) * 100;

          grade = new Grade({
            exam: exam._id,
            enrollment: enrollment._id,
            score: Math.round(score),
            percentage: Math.round(percentage),
            notes: percentage >= 80 ? 'ביצוע מעולה!' : percentage >= 60 ? 'ביצוע טוב' : 'יש מקום לשיפור',
            gradedBy: exam.createdBy,
          });
          await grade.save();
          gradesCount++;
        }
      }
    }
    console.log(`   ✅ נוצרו ${gradesCount} ציונים`);

    // סיכום
    console.log('\n' + '='.repeat(50));
    console.log('✅ סיום יצירת נתוני דמו בהצלחה!');
    console.log('='.repeat(50));
    console.log(`\n📊 סיכום:`);
    console.log(`   👨‍🏫 מנחים: ${instructors.length}`);
    console.log(`   👥 משתתפים: ${students.length}`);
    console.log(`   📚 קורסים: ${courses.length}`);
    console.log(`   🎓 סדנאות: ${workshops.length}`);
    console.log(`   📝 הרשמות לקורסים: ${enrollments.length}`);
    console.log(`   📋 מבחנים: ${exams.length}`);
    console.log(`   📊 ציונים: ${gradesCount}`);

    console.log(`\n🔑 פרטי התחברות למשתתפים:`);
    console.log(`   כל המשתתפים יכולים להתחבר ל-Student Portal עם:`);
    console.log(`   - אימייל או טלפון (כפי שהוגדר לעיל)`);
    console.log(`   - הסיסמה הראשונית שהודפסה בעת יצירת כל משתתף`);
    console.log(`\n📝 דוגמאות:`);
    if (students.length > 0) {
      const firstStudent = students[0];
      console.log(`   - ${firstStudent.name}: ${firstStudent.email || firstStudent.phone}`);
    }
    console.log(`\n💡 טיפ: השתמש ב-flag --clear כדי למחוק נתונים קיימים לפני יצירה חדשה`);
    console.log(`   לדוגמה: npm run seed:data:clear`);

    process.exit(0);
  } catch (error) {
    console.error('❌ שגיאה ביצירת נתוני דמו:', error);
    process.exit(1);
  }
};

seedData();

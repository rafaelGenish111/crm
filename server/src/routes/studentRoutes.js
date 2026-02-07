const express = require('express');
const router = express.Router();
const studentAuthController = require('../controllers/studentAuthController');
const studentController = require('../controllers/studentController');
const { authenticateStudent } = require('../middleware/studentAuth');

// Public routes
router.post('/auth/login', studentAuthController.studentLogin);
router.post('/auth/reset-password-public', studentAuthController.resetPasswordByEmailOrPhone);

// Protected routes (require student authentication)
router.use(authenticateStudent);

router.post('/auth/change-password', studentAuthController.changePassword);
router.post('/auth/reset-password', studentAuthController.resetPassword);
router.get('/profile', studentAuthController.getStudentProfile);
router.get('/courses', studentController.getStudentCourses);
router.get('/courses/:id', studentController.getStudentCourseDetails);
router.get('/grades', studentController.getStudentGrades);
router.get('/grades/:courseId', studentController.getStudentGradesByCourse);
router.get('/workshops', studentController.getRecommendedWorkshops);

module.exports = router;

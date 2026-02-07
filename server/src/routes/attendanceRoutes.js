const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/authorization');

router.use(authenticate);

router.get('/course/:courseId/sessions', checkPermission('courses', 'view'), attendanceController.getCourseSessions);
router.get('/course/:courseId', checkPermission('courses', 'view'), attendanceController.getAttendanceByCourse);
router.post('/course/:courseId', checkPermission('courses', 'update'), attendanceController.createOrUpdateAttendance);

module.exports = router;

const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/authorization');

router.use(authenticate);

router.get('/', checkPermission('courses', 'view'), courseController.getCourses);
router.get('/:id', checkPermission('courses', 'view'), courseController.getCourseById);
router.post('/', checkPermission('courses', 'create'), courseController.createCourse);
router.put('/:id', checkPermission('courses', 'update'), courseController.updateCourse);
router.delete('/:id', checkPermission('courses', 'delete'), courseController.deleteCourse);
router.post('/:id/enroll', checkPermission('courses', 'update'), courseController.enrollInCourse);
router.delete('/enrollments/:enrollmentId', checkPermission('courses', 'update'), courseController.removeEnrollment);

module.exports = router;

const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/authorization');

router.use(authenticate);

router.get('/course/:courseId', checkPermission('courses', 'view'), examController.getExamsByCourse);
router.get('/:id', checkPermission('courses', 'view'), examController.getExamById);
router.post('/course/:courseId', checkPermission('courses', 'update'), examController.createExam);
router.put('/:id', checkPermission('courses', 'update'), examController.updateExam);
router.delete('/:id', checkPermission('courses', 'update'), examController.deleteExam);
router.post('/:examId/grades', checkPermission('courses', 'update'), examController.saveGrades);

module.exports = router;

const express = require('express');
const router = express.Router();
const aiBotController = require('../controllers/aiBotController');
const { authenticateStudent } = require('../middleware/studentAuth');

// All routes require student authentication
router.use(authenticateStudent);

router.post('/message', aiBotController.sendMessage);
router.get('/history', aiBotController.getChatHistory);
router.post('/exam/generate', aiBotController.generateExamQuestion);
router.post('/exam/submit', aiBotController.submitExamAnswer);
router.post('/study-plan', aiBotController.generateStudyPlan);

module.exports = router;

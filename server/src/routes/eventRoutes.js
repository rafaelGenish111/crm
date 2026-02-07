const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/authorization');

router.use(authenticate);

// Get all events
router.get('/', checkPermission('events', 'view'), eventController.getEvents);

// Get event by ID
router.get('/:id', checkPermission('events', 'view'), eventController.getEventById);

// Create event
router.post('/', checkPermission('events', 'create'), eventController.createEvent);

// Update event
router.put('/:id', checkPermission('events', 'update'), eventController.updateEvent);

// Delete event
router.delete('/:id', checkPermission('events', 'delete'), eventController.deleteEvent);

// Add participant to event
router.post('/:id/participants', checkPermission('events', 'update'), eventController.addParticipant);

// Update enrollment
router.put('/:id/enrollments/:enrollmentId', checkPermission('events', 'update'), eventController.updateEnrollment);

// Remove participant
router.delete('/:id/participants/:enrollmentId', checkPermission('events', 'update'), eventController.removeParticipant);

module.exports = router;

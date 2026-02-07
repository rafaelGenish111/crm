const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const leadInteractionController = require('../controllers/leadInteractionController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/authorization');

// כל ה-routes דורשים authentication
router.use(authenticate);

router.get('/', checkPermission('leads', 'view'), leadController.getLeads);
router.get('/:id', checkPermission('leads', 'view'), leadController.getLeadById);
router.post('/', checkPermission('leads', 'create'), leadController.createLead);
router.put('/:id', checkPermission('leads', 'update'), leadController.updateLead);
router.delete('/:id', checkPermission('leads', 'delete'), leadController.deleteLead);
router.post('/:id/convert', checkPermission('leads', 'update'), leadController.convertToCustomer);

// Lead Interactions routes
router.post('/:leadId/interactions', checkPermission('leads', 'update'), leadInteractionController.createInteraction);
router.put('/interactions/:interactionId', checkPermission('leads', 'update'), leadInteractionController.updateInteraction);
router.delete('/interactions/:interactionId', checkPermission('leads', 'update'), leadInteractionController.deleteInteraction);

module.exports = router;

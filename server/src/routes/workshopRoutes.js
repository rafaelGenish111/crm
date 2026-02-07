const express = require('express');
const router = express.Router();
const workshopController = require('../controllers/workshopController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/authorization');

router.use(authenticate);

router.get('/', checkPermission('workshops', 'view'), workshopController.getWorkshops);
router.get('/:id', checkPermission('workshops', 'view'), workshopController.getWorkshopById);
router.post('/', checkPermission('workshops', 'create'), workshopController.createWorkshop);
router.put('/:id', checkPermission('workshops', 'update'), workshopController.updateWorkshop);
router.delete('/:id', checkPermission('workshops', 'delete'), workshopController.deleteWorkshop);
router.post('/:id/enroll', checkPermission('workshops', 'update'), workshopController.enrollInWorkshop);

module.exports = router;

const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/authorization');

router.use(authenticate);

router.get('/', checkPermission('campaigns', 'view'), campaignController.getCampaigns);
router.get('/:id', checkPermission('campaigns', 'view'), campaignController.getCampaignById);
router.post('/', checkPermission('campaigns', 'create'), campaignController.createCampaign);
router.put('/:id', checkPermission('campaigns', 'update'), campaignController.updateCampaign);
router.delete('/:id', checkPermission('campaigns', 'delete'), campaignController.deleteCampaign);

module.exports = router;

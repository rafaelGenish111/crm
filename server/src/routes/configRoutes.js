const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
// TODO: Add auth middleware when auth is implemented
// const { authenticate } = require('../middleware/auth');
// const { authorize } = require('../middleware/authorization');

// Public route - get config (needed for frontend initialization)
router.get('/', configController.getConfig);

// Get specific section
router.get('/:section', configController.getConfigSection);

// Update config (admin only - will add auth later)
// router.put('/', authenticate, authorize(['admin', 'super_admin']), configController.updateConfig);
router.put('/', configController.updateConfig);

module.exports = router;

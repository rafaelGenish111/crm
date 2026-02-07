const express = require('express');
const router = express.Router();
const path = require('path');
const popupController = require('../controllers/popupController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/authorization');

// Serve embed script (public)
router.get('/embed.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/popup-embed.js'), {
        headers: {
            'Content-Type': 'application/javascript',
        },
    });
});

// Public routes (no authentication required)
router.get('/:token', popupController.getPopupByToken);
router.post('/:token/impression', popupController.recordImpression);
router.post('/:token/click', popupController.recordClick);

// Protected route for getting embed code
router.get('/campaign/:id/embed-code', authenticate, checkPermission('campaigns', 'view'), popupController.getEmbedCode);

module.exports = router;

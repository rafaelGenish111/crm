const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Webhook routes (public - WhatsApp will call these)
router.get('/webhook', whatsappController.verifyWebhook);
router.post('/webhook', whatsappController.handleWebhook);

module.exports = router;

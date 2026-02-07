const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/authorization');

// Public webhook route
router.post('/webhook', paymentController.handleWebhook);

// Protected routes
router.post('/link', authenticate, paymentController.createPaymentLink);
router.get('/:id', authenticate, checkPermission('payments', 'view'), paymentController.getPaymentById);
router.put('/:paymentId/status', authenticate, checkPermission('payments', 'update'), paymentController.updatePaymentStatus);
router.get('/customer/:customerId/pending', authenticate, checkPermission('payments', 'view'), paymentController.getPendingPayments);

module.exports = router;

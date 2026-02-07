const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/authorization');

router.use(authenticate);

router.get('/balance', checkPermission('accounting', 'view'), accountingController.getBalance);
router.get('/profitability', checkPermission('accounting', 'view'), accountingController.getProfitabilityBreakdown);
router.get('/reports', checkPermission('accounting', 'view'), accountingController.getReports);
router.get('/invoices', checkPermission('accounting', 'view'), accountingController.getInvoicesByCustomers);
router.get('/invoices/customer/:customerId', checkPermission('accounting', 'view'), accountingController.getInvoicesByCustomer);
router.get('/customers/debts', checkPermission('accounting', 'view'), accountingController.getCustomersWithDebts);

module.exports = router;

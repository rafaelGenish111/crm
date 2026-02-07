const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/authorization');

router.use(authenticate);

router.get('/', checkPermission('customers', 'view'), customerController.getCustomers);
router.get('/:id', checkPermission('customers', 'view'), customerController.getCustomerById);
router.post('/', checkPermission('customers', 'create'), customerController.createCustomer);
router.put('/:id', checkPermission('customers', 'update'), customerController.updateCustomer);
router.post('/:id/reset-password', checkPermission('customers', 'update'), customerController.resetCustomerPassword);
router.delete('/:id', checkPermission('customers', 'delete'), customerController.deleteCustomer);

module.exports = router;

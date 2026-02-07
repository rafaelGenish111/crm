const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

// כל ה-routes דורשים authentication
router.use(authenticate);

// רק admin, admin_staff ו-super_admin יכולים לנהל משתמשים
router.get('/', authorize('admin', 'admin_staff', 'super_admin'), userController.getUsers);
router.get('/:id', authorize('admin', 'admin_staff', 'super_admin'), userController.getUserById);
router.post('/', authorize('admin', 'super_admin'), userController.createUser);
router.put('/:id', authorize('admin', 'admin_staff', 'super_admin'), userController.updateUser);
router.delete('/:id', authorize('admin', 'super_admin'), userController.deleteUser);

module.exports = router;

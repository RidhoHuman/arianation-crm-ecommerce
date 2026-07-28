const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const staffController = require('../controllers/staffController');

// All staff routes require OWNER role
router.use(authenticate);
router.use(authorize('OWNER'));

router.get('/', staffController.getAllAdmins);
router.post('/', staffController.createAdmin);
router.put('/:id/reset-password', staffController.resetAdminPassword);
router.delete('/:id', staffController.deleteAdmin);

module.exports = router;

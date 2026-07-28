const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');

// Public route to get settings
router.get('/', settingsController.getSettings);

// Protected route to update settings (Admin/Owner only)
router.put('/', authenticate, authorize('ADMIN', 'OWNER'), settingsController.updateSettings);

module.exports = router;

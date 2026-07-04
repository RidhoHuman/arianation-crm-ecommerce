// src/routes/inventory.js
/**
 * Inventory Management Routes
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const inventoryController = require('../controllers/inventoryController');

// All inventory routes require ADMIN/OWNER role
router.use(authenticate, authorize('ADMIN', 'OWNER'));

// Get inventory status
router.get('/', inventoryController.getInventoryStatus);

// Get inventory analytics
router.get('/analytics', inventoryController.getInventoryAnalytics);

// Get inventory log/history
router.get('/log', inventoryController.getInventoryLog);

// Update stock
router.patch('/:productId/stock', inventoryController.updateStock);

// Restock
router.post('/:productId/restock', inventoryController.restockProduct);

module.exports = router;

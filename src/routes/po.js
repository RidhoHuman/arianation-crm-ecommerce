// src/routes/po.js
/**
 * Pre-Order Routes
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const poController = require('../controllers/poController');

// Customer routes (authenticated)
router.post('/create', authenticate, poController.createPO);
router.get('/:id', authenticate, poController.getPO);

// Admin routes
router.get('/', authenticate, authorize('ADMIN', 'OWNER'), poController.getAllPOs);
router.patch('/:id/confirm', authenticate, authorize('ADMIN', 'OWNER'), poController.confirmPO);
router.patch('/:id/ship', authenticate, authorize('ADMIN', 'OWNER'), poController.shipPO);
router.patch('/:id/deliver', authenticate, authorize('ADMIN', 'OWNER'), poController.deliverPO);
router.patch('/:id/cancel', authenticate, authorize('ADMIN', 'OWNER'), poController.cancelPO);
router.get('/stats/overview', authenticate, authorize('ADMIN', 'OWNER'), poController.getPOStats);

module.exports = router;

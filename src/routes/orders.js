// src/routes/orders.js

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderTracking,
} = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// All order routes require authentication
router.use(generalLimiter, authenticate);

router.get('/', getAllOrders);
router.post('/', validateBody(schemas.createOrder), createOrder);
router.get('/:id', getOrderById);
router.put('/:id/status', authorize('ADMIN', 'OWNER', 'DESIGN_STAFF'), updateOrderStatus);
router.put('/:id/cancel', cancelOrder);
router.get('/:id/tracking', getOrderTracking);

module.exports = router;

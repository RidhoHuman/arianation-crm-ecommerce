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
  getOrderStatusHistory,
  getOrderTimeline,
  getOrderNotifications,
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

const validateCreateOrderRequest = (req, res, next) => {
  const { items, deliveryAddress, notes } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'items must be a non-empty array.',
    });
  }

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];

    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return res.status(400).json({
        success: false,
        message: `items[${index}] must be an object.`,
      });
    }

    if (typeof item.productId !== 'string' || item.productId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: `items[${index}].productId is required.`,
      });
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: `items[${index}].quantity must be a positive integer.`,
      });
    }
  }

  if (!deliveryAddress || typeof deliveryAddress !== 'object' || Array.isArray(deliveryAddress)) {
    return res.status(400).json({
      success: false,
      message: 'deliveryAddress is required.',
    });
  }

  const requiredAddressFields = ['fullName', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
  for (const field of requiredAddressFields) {
    if (
      typeof deliveryAddress[field] !== 'string' ||
      deliveryAddress[field].trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        message: `deliveryAddress.${field} is required.`,
      });
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(req.body || {}, 'notes') &&
    notes != null &&
    typeof notes !== 'string'
  ) {
    return res.status(400).json({
      success: false,
      message: 'notes must be a string.',
    });
  }

  return next();
};

// All order routes require authentication
router.use(generalLimiter, authenticate);

router.get('/', getAllOrders);
router.post('/', validateBody(schemas.createOrder), validateCreateOrderRequest, createOrder);
router.get('/:id', getOrderById);
router.put('/:id/status', authorize('ADMIN', 'OWNER', 'DESIGN_STAFF'), updateOrderStatus);
router.put('/:id/cancel', cancelOrder);
router.get('/:id/tracking', getOrderTracking);

// Order fulfillment routes
router.get('/:id/status-history', getOrderStatusHistory);
router.get('/:id/timeline', getOrderTimeline);
router.get('/:id/notifications', getOrderNotifications);

module.exports = router;

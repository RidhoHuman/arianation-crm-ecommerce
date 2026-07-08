// src/routes/orders.js

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  createOrder,
  createGuestOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderTracking,
  getOrderStatusHistory,
  getOrderTimeline,
  getOrderNotifications,
  getShippingRates,
  createPelunasanInvoice,
} = require('../controllers/orderController');
const { createCustomOrder, checkoutCustomSablonDP } = require('../controllers/customOrderController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');
const { uploadCustomOrderFiles } = require('../middleware/upload');

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

  const requiredAddressFields = [
    'fullName',
    'addressLine1',
    'city',
    'state',
    'postalCode',
    'country',
  ];
  for (const field of requiredAddressFields) {
    if (typeof deliveryAddress[field] !== 'string' || deliveryAddress[field].trim() === '') {
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

// GUEST CHECKOUT ROUTE - NO AUTHENTICATION REQUIRED
const guestCheckoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many checkout attempts. Please try again later.' },
});

router.post('/guest', guestCheckoutLimiter, createGuestOrder);
router.post('/shipping-rates', optionalAuth, getShippingRates);

// Routes that can be accessed by both guests (via order ID) and authenticated users
router.get('/:id', optionalAuth, getOrderById);
router.get('/:id/tracking', optionalAuth, getOrderTracking);
router.post('/:id/pelunasan', optionalAuth, createPelunasanInvoice);

// All other order routes require authentication
router.use(generalLimiter, authenticate);

router.get('/', getAllOrders);
router.post('/', validateBody(schemas.createOrder), validateCreateOrderRequest, createOrder);
router.post('/custom-sablon', uploadCustomOrderFiles, createCustomOrder);
router.post('/custom-sablon/:id/checkout', checkoutCustomSablonDP);
router.put('/:id/status', authorize('ADMIN', 'OWNER', 'DESIGN_STAFF'), updateOrderStatus);
router.put('/:id/cancel', cancelOrder);

// Order fulfillment routes
router.get('/:id/status-history', getOrderStatusHistory);
router.get('/:id/timeline', getOrderTimeline);
router.get('/:id/notifications', getOrderNotifications);

module.exports = router;

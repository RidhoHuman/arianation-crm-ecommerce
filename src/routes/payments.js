// src/routes/payments.js

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  getAllPayments,
  getPaymentById,
  createPayment,
  verifyPayment,
  getPaymentByOrder,
} = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// All payment routes require authentication
router.use(authenticate);
router.use(generalLimiter);

// Admin/Owner only - list all payments
router.get('/', authorize('ADMIN', 'OWNER'), getAllPayments);

// Create payment for an order
router.post('/', createPayment);

// Get payment by order
router.get('/order/:orderId', getPaymentByOrder);

// Get specific payment
router.get('/:id', getPaymentById);

// Admin/Owner verify payment
router.put('/:id/verify', authorize('ADMIN', 'OWNER'), verifyPayment);

module.exports = router;

// src/routes/payments.js

const express = require('express');
const router = express.Router();
const {
  getAllPayments,
  getPaymentById,
  createPayment,
  verifyPayment,
  getPaymentByOrder,
} = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

// All payment routes require authentication
router.use(authenticate);

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

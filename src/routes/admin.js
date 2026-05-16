// src/routes/admin.js

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  getDashboard,
  // Products
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  // Orders
  getOrders,
  getOrderDetail,
  updateOrderStatus,
  updateOrderTracking,
  cancelOrder,
  exportOrders,
  // Design Requests
  getDesignRequests,
  getDesignRequestDetail,
  updateDesignRequestStatus,
  // Users
  getUsers,
  getUserDetail,
  updateUserRole,
  toggleUserStatus,
  // Payments
  getPayments,
  verifyPayment,
  processRefund,
  // Audit Logs
  getAuditLogs,
} = require('../controllers/adminController');

const {
  getSalesAnalytics,
  getRevenueAnalytics,
  getOrderAnalytics,
  getCustomerAnalytics,
  getDesignAnalytics,
} = require('../controllers/analyticsController');

const { authenticate, authorize } = require('../middleware/auth');

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// All admin routes require authentication + OWNER/ADMIN role
router.use(adminLimiter, authenticate, authorize('OWNER', 'ADMIN'));

// ============================================================
// DASHBOARD
// ============================================================
router.get('/dashboard', getDashboard);

// ============================================================
// PRODUCTS
// ============================================================
router.get('/products', getProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// ============================================================
// ORDERS
// ============================================================
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderDetail);
router.put('/orders/:id/status', updateOrderStatus);
router.put('/orders/:id/tracking', updateOrderTracking);
router.put('/orders/:id/cancel', cancelOrder);
router.get('/orders/export/csv', exportOrders);

// ============================================================
// DESIGN REQUESTS
// ============================================================
router.get('/design-requests', getDesignRequests);
router.get('/design-requests/:id', getDesignRequestDetail);
router.put('/design-requests/:id/status', updateDesignRequestStatus);

// ============================================================
// USERS
// ============================================================
router.get('/users', getUsers);
router.get('/users/:id', getUserDetail);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', toggleUserStatus);

// ============================================================
// PAYMENTS
// ============================================================
router.get('/payments', getPayments);
router.put('/payments/:id/verify', verifyPayment);
router.post('/payments/:id/refund', processRefund);

// ============================================================
// AUDIT LOGS
// ============================================================
router.get('/audit-logs', getAuditLogs);

// ============================================================
// ORDER FULFILLMENT (Status History, Timeline, Notifications)
// ============================================================
router.get('/orders/:id/status-history', require('../controllers/orderController').getOrderStatusHistory);
router.get('/orders/:id/timeline', require('../controllers/orderController').getOrderTimeline);
router.get('/orders/:id/notifications', require('../controllers/orderController').getOrderNotifications);

// ============================================================
// ANALYTICS
// ============================================================
router.get('/analytics/sales', getSalesAnalytics);
router.get('/analytics/revenue', getRevenueAnalytics);
router.get('/analytics/orders', getOrderAnalytics);
router.get('/analytics/customers', getCustomerAnalytics);
router.get('/analytics/designs', getDesignAnalytics);

module.exports = router;

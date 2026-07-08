// src/routes/admin.js

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const upload = require('../middleware/upload');

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
  requestPickup,
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
  // Couriers
  getCouriers,
  toggleCourier,
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
router.post('/products', upload.uploadProductImage, createProduct);
router.post('/products/upload-image', upload.uploadProductImage, require('../controllers/adminController').uploadImageHandler);
router.put('/products/:id', upload.uploadProductImage, updateProduct);
router.delete('/products/:id', deleteProduct);

// ============================================================
// ORDERS
// ============================================================
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderDetail);
router.put('/orders/:id/status', updateOrderStatus);
router.put('/orders/:id/tracking', updateOrderTracking);
router.put('/orders/:id/pickup', requestPickup);
router.put('/orders/:id/cancel', cancelOrder);
router.get('/orders/export/csv', exportOrders);

// ============================================================
// LOGISTICS / COURIERS
// ============================================================
router.get('/couriers', getCouriers);
router.put('/couriers/:code/toggle', toggleCourier);

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
router.get(
  '/orders/:id/status-history',
  require('../controllers/orderController').getOrderStatusHistory
);
router.get('/orders/:id/timeline', require('../controllers/orderController').getOrderTimeline);
router.get(
  '/orders/:id/notifications',
  require('../controllers/orderController').getOrderNotifications
);

// ============================================================
// ANALYTICS
// ============================================================
router.get('/analytics/sales', getSalesAnalytics);
router.get('/analytics/revenue', getRevenueAnalytics);
router.get('/analytics/orders', getOrderAnalytics);
router.get('/analytics/customers', getCustomerAnalytics);
router.get('/analytics/designs', getDesignAnalytics);

// ============================================================
// CUSTOMER CRM
// ============================================================
const inventoryController = require('../controllers/inventoryController');
const customerController = require('../controllers/customerController');
const settingsController = require('../controllers/settingsController');
const printTechniqueController = require('../controllers/printTechniqueController');

// Rute untuk Settings
router.get('/settings', settingsController.getSettings);
router.put('/settings', settingsController.updateSettings);

// Rute untuk Customer & CRM
router.get('/customers', customerController.getCustomers);
router.post('/customers/promo', customerController.sendPromoEmail);
router.put('/customers/:id', customerController.updateCustomer);

// ============================================================
// PRINT TECHNIQUES (TEKNIK SABLON)
// ============================================================
router.get('/techniques', printTechniqueController.getAllAdmin);
router.post('/techniques', printTechniqueController.create);
router.put('/techniques/:id', printTechniqueController.update);
router.delete('/techniques/:id', printTechniqueController.delete);

// ============================================================
// PRODUCT REVIEWS
// ============================================================
const reviewController = require('../controllers/reviewController');
router.get('/reviews', reviewController.getAllReviewsAdmin);
router.delete('/reviews/:id', reviewController.deleteReviewAdmin);

module.exports = router;

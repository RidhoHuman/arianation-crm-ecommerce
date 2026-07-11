const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

// Define routes
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/mark-all-read', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

// Customer routes
router.get('/customer', authenticate, notificationController.getCustomerNotifications);
router.put('/customer/mark-all-read', authenticate, notificationController.markAllCustomerAsRead);
router.put('/customer/:id/read', authenticate, notificationController.markCustomerAsRead);

// Web Push routes
router.get('/vapid-public-key', notificationController.getVapidPublicKey);
router.post('/subscribe', authenticate, notificationController.subscribeToPush);
router.delete('/unsubscribe', authenticate, notificationController.unsubscribeFromPush);

module.exports = router;

const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriberController');
const { authenticate, authorize } = require('../middleware/auth');

// Public route to subscribe
router.post('/subscribe', subscriberController.subscribe);

// Public route to unsubscribe (if they click link in email)
router.post('/unsubscribe', subscriberController.unsubscribe);

// Admin routes
router.get('/', authenticate, authorize('ADMIN', 'OWNER'), subscriberController.getSubscribers);
router.post('/send-promo', authenticate, authorize('ADMIN', 'OWNER'), subscriberController.sendPromoEmail);

module.exports = router;

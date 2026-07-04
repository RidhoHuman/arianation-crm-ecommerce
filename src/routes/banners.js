const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { authenticate, authorize } = require('../middleware/auth');

// Public route (for frontend clients)
router.get('/', bannerController.getBanners);

// Admin routes
router.post('/', authenticate, authorize('ADMIN', 'OWNER'), bannerController.createBanner);
router.put('/:id', authenticate, authorize('ADMIN', 'OWNER'), bannerController.updateBanner);
router.delete('/:id', authenticate, authorize('ADMIN', 'OWNER'), bannerController.deleteBanner);

module.exports = router;

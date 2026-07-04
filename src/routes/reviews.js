const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

// Public endpoints
router.get('/product/:productId', reviewController.getProductReviews);

// Protected endpoints (Hanya user login yang bisa beri ulasan)
router.use(authenticate);
router.post('/', reviewController.createReview);

module.exports = router;

const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadProductImage } = require('../middleware/upload');

// Public route to get active portfolios (with pagination limit)
router.get('/', portfolioController.getAllPortfolio);

// Admin protected routes
router.use(authenticate);
router.use(authorize('ADMIN', 'STAFF'));

// For Admin: getting all including inactive
router.get('/admin', portfolioController.getAllPortfolio);

router.post('/', uploadProductImage, portfolioController.createPortfolio);
router.put('/:id', uploadProductImage, portfolioController.updatePortfolio);
router.delete('/:id', portfolioController.deletePortfolio);

module.exports = router;

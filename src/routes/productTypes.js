const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const productTypeController = require('../controllers/productTypeController');

// Public routes (for navbar)
router.get('/', productTypeController.getProductTypes);
router.get('/:id', productTypeController.getProductTypeById);

// Admin routes
router.post('/', authenticate, authorize('ADMIN', 'OWNER'), productTypeController.createProductType);
router.put('/:id', authenticate, authorize('ADMIN', 'OWNER'), productTypeController.updateProductType);
router.delete('/:id', authenticate, authorize('ADMIN', 'OWNER'), productTypeController.deleteProductType);

module.exports = router;

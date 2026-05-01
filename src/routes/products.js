// src/routes/products.js

const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createVariant,
} = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');

// Public routes
router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

// Protected routes - Admin/Owner only
router.post('/', authenticate, authorize('ADMIN', 'OWNER'), validateBody(schemas.createProduct), createProduct);
router.put('/:id', authenticate, authorize('ADMIN', 'OWNER'), updateProduct);
router.delete('/:id', authenticate, authorize('ADMIN', 'OWNER'), deleteProduct);
router.post('/:id/variants', authenticate, authorize('ADMIN', 'OWNER'), createVariant);

module.exports = router;

// src/routes/products.js

const express = require('express');
const rateLimit = require('express-rate-limit');
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

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Public routes
router.get('/', generalLimiter, getAllProducts);
router.get('/categories', generalLimiter, getCategories);
router.get('/:id', generalLimiter, getProductById);

// Protected routes - Admin/Owner only
router.post('/', generalLimiter, authenticate, authorize('ADMIN', 'OWNER'), validateBody(schemas.createProduct), createProduct);
router.put('/:id', generalLimiter, authenticate, authorize('ADMIN', 'OWNER'), updateProduct);
router.delete('/:id', generalLimiter, authenticate, authorize('ADMIN', 'OWNER'), deleteProduct);
router.post('/:id/variants', generalLimiter, authenticate, authorize('ADMIN', 'OWNER'), createVariant);

module.exports = router;

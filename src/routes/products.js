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
  uploadProductImage,
  uploadProductImageAndUpdate,
} = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');
const { uploadProductImage: uploadProductImageMiddleware } = require('../middleware/upload');

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
router.post(
  '/',
  generalLimiter,
  authenticate,
  authorize('ADMIN', 'OWNER'),
  validateBody(schemas.createProduct),
  createProduct
);
router.put('/:id', generalLimiter, authenticate, authorize('ADMIN', 'OWNER'), updateProduct);
router.delete('/:id', generalLimiter, authenticate, authorize('ADMIN', 'OWNER'), deleteProduct);
router.post(
  '/:id/variants',
  generalLimiter,
  authenticate,
  authorize('ADMIN', 'OWNER'),
  createVariant
);

// Upload routes
router.post(
  '/upload-image',
  generalLimiter,
  authenticate,
  authorize('ADMIN', 'OWNER'),
  uploadProductImageMiddleware,
  uploadProductImage
);

router.post(
  '/:id/upload-image',
  generalLimiter,
  authenticate,
  authorize('ADMIN', 'OWNER'),
  uploadProductImageMiddleware,
  uploadProductImageAndUpdate
);

module.exports = router;

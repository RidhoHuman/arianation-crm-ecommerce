// src/routes/category.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// Admin only routes (Admin & Owner)
router.post('/', authenticate, authorize('ADMIN', 'OWNER'), categoryController.createCategory);
router.put('/:id', authenticate, authorize('ADMIN', 'OWNER'), categoryController.updateCategory);
router.delete('/:id', authenticate, authorize('ADMIN', 'OWNER'), categoryController.deleteCategory);

module.exports = router;

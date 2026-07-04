const express = require('express');
const router = express.Router();
const {
  getAllCollections,
  getCollectionById,
  getCollectionBySlug,
  createCollection,
  updateCollection,
  deleteCollection,
  getProductsInCollection,
  addProductToCollection,
  removeProductFromCollection
} = require('../controllers/collectionController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllCollections);
router.get('/slug/:slug', getCollectionBySlug);
router.get('/:id', getCollectionById);
router.get('/:id/products', getProductsInCollection);

// Protected routes (Admin/Owner)
router.post('/', authenticate, authorize('ADMIN', 'OWNER'), createCollection);
router.put('/:id', authenticate, authorize('ADMIN', 'OWNER'), updateCollection);
router.delete('/:id', authenticate, authorize('ADMIN', 'OWNER'), deleteCollection);
router.post('/:id/products', authenticate, authorize('ADMIN', 'OWNER'), addProductToCollection);
router.delete('/:id/products/:productId', authenticate, authorize('ADMIN', 'OWNER'), removeProductFromCollection);

module.exports = router;

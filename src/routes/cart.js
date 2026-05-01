// src/routes/cart.js

const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');

// All cart routes require authentication
router.use(authenticate);

router.get('/', getCart);
router.post('/items', validateBody(schemas.addToCart), addToCart);
router.put('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeFromCart);
router.delete('/', clearCart);

module.exports = router;

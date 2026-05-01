// src/routes/cart.js

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// All cart routes require authentication
router.use(authenticate);
router.use(generalLimiter);

router.get('/', getCart);
router.post('/items', validateBody(schemas.addToCart), addToCart);
router.put('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeFromCart);
router.delete('/', clearCart);

module.exports = router;

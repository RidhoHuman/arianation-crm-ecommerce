// routes/index.js
const express = require('express');
const router = express.Router();

// Import routes
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');

// Use routes
router.use('/users', userRoutes);
router.use('/products', productRoutes);

module.exports = router;
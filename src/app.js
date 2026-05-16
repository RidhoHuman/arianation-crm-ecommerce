require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const prisma = require('./config/database');
const { validateEnv } = require('./config/env');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const designRequestRoutes = require('./routes/designRequests');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhooks');
const checkoutRoutes = require('../routes/checkout');

// Validate environment variables (throws if invalid)
validateEnv();

const app = express();

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(logger);

// Health
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Arianation API is running', timestamp: new Date(), environment: process.env.NODE_ENV });
});

// API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', checkoutRoutes);
app.use('/api/design-requests', designRequestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

app.use(errorHandler);

module.exports = app;

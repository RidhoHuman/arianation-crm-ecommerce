// Only load .env in development, not in production (Vercel)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const Sentry = require('@sentry/node');

const prisma = require('./config/database');
const { config, validateEnv } = require('./config/env');
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
const batchRoutes = require('./routes/batch');
const analyticsRoutes = require('./routes/analytics');
const checkoutRoutes = require('../routes/checkout');
const uploadRoutes = require('./routes/uploads');

// Validate environment variables (throws if invalid)
try {
  validateEnv();
} catch (error) {
  console.warn('Environment validation warning:', error.message);
  // Don't throw - allow app to load, but log warning
  // This handles cases where env vars come from Vercel
}

// Initialize Sentry if DSN provided
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.0, // disable tracing by default; adjust if needed
  });
}

const app = express();

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(logger);

// Sentry request handler must be before routes (if enabled)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
}

// Static file serving for uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Debug middleware - only in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log('[EXPRESS ROUTE DEBUG] Incoming:', {
      method: req.method,
      path: req.path,
      url: req.url,
      originalUrl: req.originalUrl,
    });
    next();
  });
}

// Health
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Arianation API is running',
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
  });
});

// Debug endpoint - only in development
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug', async (req, res) => {
    try {
      const dbUrl = process.env.DATABASE_URL;
      const dbUrlMasked = dbUrl ? dbUrl.replace(/:[^@]*@/, ':***@') : 'NOT SET';

      // Try a simple query
      let dbStatus = 'Unknown';
      let tables = [];
      try {
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        dbStatus = 'Connected';

        // Try to list tables
        const tablesResult =
          await prisma.$queryRaw`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'arianation_db'`;
        tables = tablesResult.map((t) => t.TABLE_NAME);
      } catch (dbError) {
        dbStatus = `Failed: ${dbError.message}`;
      }

      res.json({
        success: true,
        debug: {
          NODE_ENV: process.env.NODE_ENV,
          DATABASE_URL: dbUrlMasked,
          Database_Status: dbStatus,
          Tables: tables,
          Timestamp: new Date(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : 'Not shown in production',
      });
    }
  });
}

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
app.use('/api/batch', batchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/webhooks', webhookRoutes);

// Debug middleware - logs all 404s before they hit the handler (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log('[ROUTE NOT MATCHED]', {
      method: req.method,
      path: req.path,
      url: req.url,
    });
    next();
  });
}

// 404
app.use((req, res) => {
  console.log('[404 HANDLER]', {
    method: req.method,
    path: req.path,
    message: `Route ${req.method} ${req.path} not found`,
  });
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});
// Sentry error handler (if enabled) should be before custom error handler
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

app.use(errorHandler);

module.exports = app;

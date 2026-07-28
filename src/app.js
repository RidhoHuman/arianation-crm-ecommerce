// Only load .env in development, not in production (Vercel)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const Sentry = require('@sentry/node');

const knex = require('./config/knex');
const { config, validateEnv } = require('./config/env');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const passport = require('./config/passport');

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
const sitemapRoutes = require('./routes/sitemap');
const poRoutes = require('./routes/po');
const inventoryRoutes = require('./routes/inventory');
const wishlistRoutes = require('./routes/wishlist');
const categoryRoutes = require('./routes/category');
const collectionRoutes = require('./routes/collections');
const productTypeRoutes = require('./routes/productTypes');
const bannerRoutes = require('./routes/banners');
const subscriberRoutes = require('./routes/subscribers');
const notificationRoutes = require('./routes/notificationRoutes');
const designInfoRoutes = require('./routes/designInfo');
const portfolioRoutes = require('./routes/portfolioRoutes');
const printTechniqueRoutes = require('./routes/printTechniques');
const reviewRoutes = require('./routes/reviews');
const voucherRoutes = require('./routes/vouchers');
const staffRoutes = require('./routes/staffRoutes');

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

// Compression middleware for Gzip (reduces response size 20-30%)
app.use(compression());

// CORS
const defaultFrontendOrigin =
  process.env.NODE_ENV === 'production'
    ? 'https://arianation-crm-ecommerce.vercel.app'
    : 'http://localhost:3000';

const allowedOrigins = (
  process.env.CORS_ALLOWED_ORIGINS ||
  process.env.FRONTEND_URL ||
  defaultFrontendOrigin
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, allowedOrigins[0]);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(logger);

// Initialize Passport
app.use(passport.initialize());

// Sentry request handler must be before routes (if enabled)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
}

// Static file serving for uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve the Vite frontend build when present (Vercel production)
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

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
        const result = await knex.raw('SELECT 1 as test');
        dbStatus = 'Connected';

        // Try to list tables
        const tablesResult = await knex.raw(
          "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'arianation_db'"
        );
        tables = tablesResult[0].map((t) => t.TABLE_NAME);
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

// Setup database endpoint - protected with secret key
// Usage: POST /api/setup-db?secret=SETUP_SECRET or POST /api/setup-db with X-Setup-Token header
// Only requires auth if users already exist (prevent re-initialization)
app.post('/api/setup-db', async (req, res) => {
  try {
    // Check if users already exist
    const existingUsers = await knex('user')
      .first()
      .catch(() => null);

    // If users exist, require authentication
    if (existingUsers) {
      const secret = req.query.secret || req.headers['x-setup-token'];
      const expectedSecret = process.env.SETUP_SECRET || process.env.JWT_SECRET;

      if (!secret || secret !== expectedSecret) {
        console.log('⚠️  Setup endpoint unauthorized attempt (database already initialized)');
        return res.status(401).json({
          success: false,
          error: 'Database already initialized. Authorization required for reset.',
        });
      }
    } else {
      console.log('✅ First setup detected - proceeding without authentication');
    }

    const bcrypt = require('bcryptjs');

    // 1. Create schema
    console.log('🔄 Creating database schema...');
    const tables = [
      {
        name: 'user',
        create: async (t) => {
          t.string('id').primary();
          t.string('email').unique();
          t.string('password');
          t.string('fullName');
          t.string('phone').nullable();
          t.string('role');
          t.boolean('isActive').defaultTo(true);
          t.text('address').nullable();
          t.string('city').nullable();
          t.string('postalCode').nullable();
          t.string('province').nullable();
          t.boolean('emailVerified').defaultTo(false);
          t.timestamp('createdAt').defaultTo(knex.fn.now());
          t.timestamp('updatedAt').defaultTo(knex.fn.now());
        },
      },
      {
        name: 'otp_verifications',
        create: async (t) => {
          t.string('phone').primary();
          t.string('otpCode');
          t.timestamp('expiresAt');
          t.timestamp('createdAt').defaultTo(knex.fn.now());
        },
      },
      {
        name: 'productCategory',
        create: async (t) => {
          t.string('id').primary();
          t.string('categoryName');
          t.string('businessType');
          t.timestamp('createdAt').defaultTo(knex.fn.now());
          t.timestamp('updatedAt').defaultTo(knex.fn.now());
        },
      },
      {
        name: 'product',
        create: async (t) => {
          t.string('id').primary();
          t.string('categoryId');
          t.string('productName');
          t.decimal('price', 10, 2).defaultTo(0);
          t.integer('stockQuantity').defaultTo(0);
          t.string('productType');
          t.string('businessType');
          t.string('imageUrl').nullable();
          t.text('description').nullable();
          t.boolean('isActive').defaultTo(true);
          t.string('tags').nullable();
          t.boolean('isSale').defaultTo(false);
          t.timestamp('createdAt').defaultTo(knex.fn.now());
          t.timestamp('updatedAt').defaultTo(knex.fn.now());
        },
      },
      {
        name: 'collection',
        create: async (t) => {
          t.string('id').primary();
          t.string('name');
          t.string('slug').unique();
          t.text('description').nullable();
          t.string('imageUrl').nullable();
          t.boolean('isActive').defaultTo(true);
          t.timestamp('createdAt').defaultTo(knex.fn.now());
          t.timestamp('updatedAt').defaultTo(knex.fn.now());
        },
      },
      {
        name: 'voucher',
        create: async (t) => {
          t.string('id').primary();
          t.string('code').unique().notNullable();
          t.string('type').notNullable().defaultTo('PERCENTAGE'); // PERCENTAGE, NOMINAL
          t.decimal('value', 10, 2).notNullable();
          t.decimal('minPurchase', 10, 2).defaultTo(0);
          t.decimal('maxDiscount', 10, 2).defaultTo(0);
          t.integer('usageLimit').nullable();
          t.integer('usedCount').defaultTo(0);
          t.boolean('isActive').defaultTo(true);
          t.timestamp('expiresAt').nullable();
          t.timestamp('createdAt').defaultTo(knex.fn.now());
          t.timestamp('updatedAt').defaultTo(knex.fn.now());
        },
      },
      {
        name: 'product_collection',
        create: async (t) => {
          t.string('productId');
          t.string('collectionId');
          t.primary(['productId', 'collectionId']);
        },
      },
      {
        name: 'order',
        create: async (t) => {
          t.string('id').primary();
          t.string('orderNumber').unique();
          t.string('userId').nullable();
          t.string('guestEmail').nullable();
          t.decimal('totalAmount', 10, 2).defaultTo(0);
          t.decimal('tierDiscountAmount', 10, 2).defaultTo(0);
          t.integer('tierDiscountPercentage').defaultTo(0);
          t.string('voucherCode').nullable();
          t.decimal('voucherDiscountAmount', 10, 2).defaultTo(0);
          t.string('paymentMethod').nullable();
          t.string('status').defaultTo('pending');
          t.text('shippingAddress').nullable();
          t.timestamp('createdAt').defaultTo(knex.fn.now());
          t.timestamp('updatedAt').defaultTo(knex.fn.now());
        },
      },
      {
        name: 'orderItem',
        create: async (t) => {
          t.string('id').primary();
          t.string('orderId');
          t.string('productId');
          t.integer('quantity').defaultTo(1);
          t.decimal('unitPrice', 10, 2).defaultTo(0);
          t.decimal('subtotal', 10, 2).defaultTo(0);
          t.timestamp('createdAt').defaultTo(knex.fn.now());
        },
      },
      {
        name: 'payment',
        create: async (t) => {
          t.string('id').primary();
          t.string('orderId');
          t.decimal('amount', 10, 2).defaultTo(0);
          t.string('method');
          t.string('status');
          t.string('transactionId').nullable();
          t.timestamp('createdAt').defaultTo(knex.fn.now());
          t.timestamp('updatedAt').defaultTo(knex.fn.now());
        },
      },
      {
        name: 'orderStatusHistory',
        create: async (t) => {
          t.string('id').primary();
          t.string('orderId');
          t.string('previousStatus').nullable();
          t.string('newStatus');
          t.string('reason').nullable();
          t.string('updatedBy').nullable();
          t.text('notes').nullable();
          t.timestamp('createdAt').defaultTo(knex.fn.now());
        },
      },
      {
        name: 'orderTracking',
        create: async (t) => {
          t.string('id').primary();
          t.string('orderId');
          t.string('trackingNumber').nullable();
          t.string('courier').nullable();
          t.timestamp('createdAt').defaultTo(knex.fn.now());
        },
      },
      {
        name: 'orderNotification',
        create: async (t) => {
          t.string('id').primary();
          t.string('orderId');
          t.string('userId').nullable();
          t.string('recipientEmail').nullable();
          t.string('type');
          t.string('title');
          t.text('message');
          t.boolean('emailSent').defaultTo(false);
          t.text('payload').nullable();
          t.timestamp('createdAt').defaultTo(knex.fn.now());
        },
      },
      {
        name: 'system_activity',
        create: async (t) => {
          t.string('id').primary();
          t.string('userId').nullable();
          t.string('action');
          t.text('details').nullable();
          t.string('entityType').nullable();
          t.string('entityId').nullable();
          t.timestamp('createdAt').defaultTo(knex.fn.now());
        },
      },
      {
        name: 'pushSubscriptions',
        create: async (t) => {
          t.increments('id').primary();
          t.string('userId').notNullable();
          t.text('endpoint').notNullable();
          t.text('p256dh').notNullable();
          t.text('auth').notNullable();
          t.timestamp('createdAt').defaultTo(knex.fn.now());
        },
      },
    ];

    for (const table of tables) {
      const hasTable = await knex.schema.hasTable(table.name);
      if (!hasTable) {
        console.log(`📝 Creating ${table.name}...`);
        await knex.schema.createTable(table.name, table.create);
      }
    }

    // Auto-migrate schema updates
    const hasTags = await knex.schema.hasColumn('product', 'tags');
    if (!hasTags) {
      console.log(`📝 Adding tags and isSale to product...`);
      await knex.schema.alterTable('product', (t) => {
        t.string('tags').nullable();
        t.boolean('isSale').defaultTo(false);
      });
    }

    const hasSalePrice = await knex.schema.hasColumn('product', 'salePrice');
    if (!hasSalePrice) {
      console.log(`📝 Adding salePrice to product...`);
      await knex.schema.alterTable('product', (t) => {
        t.decimal('salePrice', 10, 2).nullable();
      });
    }

    const hasSystemActivity = await knex.schema.hasTable('system_activity');
    if (!hasSystemActivity) {
      console.log(`📝 Creating system_activity table (auto-migrate)...`);
      await knex.schema.createTable('system_activity', (t) => {
        t.string('id').primary();
        t.string('userId').nullable();
        t.string('action');
        t.text('details').nullable();
        t.string('entityType').nullable();
        t.string('entityId').nullable();
        t.timestamp('createdAt').defaultTo(knex.fn.now());
      });
    }

    const hasPushSubscriptions = await knex.schema.hasTable('pushSubscriptions');
    if (!hasPushSubscriptions) {
      console.log(`📝 Creating pushSubscriptions table (auto-migrate)...`);
      await knex.schema.createTable('pushSubscriptions', (t) => {
        t.increments('id').primary();
        t.string('userId').notNullable();
        t.text('endpoint').notNullable();
        t.text('p256dh').notNullable();
        t.text('auth').notNullable();
        t.timestamp('createdAt').defaultTo(knex.fn.now());
      });
    }

    // 2. Seed sample data
    console.log('🌱 Seeding sample data...');

    // Check if users exist
    const existingUser = await knex('user').first();
    if (!existingUser) {
      const users = [
        {
          id: 'owner-001',
          email: 'owner@arianation.com',
          password: await bcrypt.hash('owner123', 10),
          fullName: 'Owner Arianation',
          role: 'OWNER',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'admin-001',
          email: 'admin@arianation.com',
          password: await bcrypt.hash('admin123', 10),
          fullName: 'Admin Staff',
          role: 'ADMIN',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'customer-001',
          email: 'customer1@example.com',
          password: await bcrypt.hash('password123', 10),
          fullName: 'Customer One',
          role: 'CUSTOMER',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      await knex('user').insert(users);
      console.log(`✅ ${users.length} users created`);
    }

    // Check if products exist
    const existingProduct = await knex('product').first();
    if (!existingProduct) {
      const categories = [
        {
          id: 'cat-001',
          categoryName: 'Casual T-Shirt',
          businessType: 'retail',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cat-002',
          categoryName: 'Hoodie',
          businessType: 'retail',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      await knex('productCategory').insert(categories);

      const products = [
        {
          id: 'prod-001',
          categoryId: 'cat-001',
          productName: 'Basic White T-Shirt',
          price: 99000,
          stockQuantity: 100,
          productType: 'casual',
          businessType: 'retail',
          description: 'Comfortable white t-shirt',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'prod-002',
          categoryId: 'cat-002',
          productName: 'Grey Hoodie',
          price: 249000,
          stockQuantity: 50,
          productType: 'casual',
          businessType: 'retail',
          description: 'Premium grey hoodie',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      await knex('product').insert(products);
      console.log(`✅ ${products.length} products and categories created`);
    }

    res.json({
      success: true,
      message: 'Database setup completed',
      credentials: {
        owner: { email: 'owner@arianation.com', password: 'owner123' },
        admin: { email: 'admin@arianation.com', password: 'admin123' },
        customer: { email: 'customer1@example.com', password: 'password123' },
      },
    });
  } catch (error) {
    console.error('❌ Setup failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/product-types', productTypeRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', checkoutRoutes);
app.use('/api/design-requests', designRequestRoutes);
app.use('/api/design-info', designInfoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/po', poRoutes);
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/print-techniques', printTechniqueRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/settings', require('./routes/settings'));
app.use('/api/staff', staffRoutes);

// SEO Routes (Sitemap)
app.use('/api', sitemapRoutes);

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
  const isSpaRequest =
    req.method === 'GET' &&
    (req.path === '/' || req.path === '/api' || !req.path.startsWith('/api/'));

  if (isSpaRequest) {
    const indexPath = path.join(frontendDistPath, 'index.html');
    return res.sendFile(indexPath, (err) => {
      if (err) {
        res
          .status(404)
          .json({ success: false, message: `Route ${req.method} ${req.path} not found` });
      }
    });
  }

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

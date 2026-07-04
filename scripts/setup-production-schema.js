#!/usr/bin/env node
/**
 * Setup production database schema using Knex
 * Usage: node scripts/setup-production-schema.js
 */

const path = require('path');
const dotenv = require('dotenv');

// Load .env atau environment variables yang sudah ada
dotenv.config();

const knex = require('knex');

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL;
const isPostgresUrl = DATABASE_URL && /^postgres(ql)?:\/\//i.test(DATABASE_URL);

const db = knex({
  client: DATABASE_URL ? (isPostgresUrl ? 'pg' : 'mysql2') : 'mysql2',
  connection: DATABASE_URL || {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'arianation_user',
    password: process.env.DB_PASSWORD || 'AriaNation@2024',
    database: process.env.DB_NAME || 'arianation_db',
  },
});

async function setupSchema() {
  try {
    console.log('🔄 Memulai setup production schema...');

    // User table
    const hasUserTable = await db.schema.hasTable('user');
    if (!hasUserTable) {
      console.log('📝 Creating user table...');
      await db.schema.createTable('user', (t) => {
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
        t.integer('rewardPoints').defaultTo(0);
        t.boolean('emailVerified').defaultTo(false);
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ user table created');
    } else {
      console.log('⏭️  user table sudah ada');
    }

    // Product Category table
    const hasCategoryTable = await db.schema.hasTable('productCategory');
    if (!hasCategoryTable) {
      console.log('📝 Creating productCategory table...');
      await db.schema.createTable('productCategory', (t) => {
        t.string('id').primary();
        t.string('categoryName');
        t.string('businessType');
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ productCategory table created');
    } else {
      console.log('⏭️  productCategory table sudah ada');
    }

    // Product table
    const hasProductTable = await db.schema.hasTable('product');
    if (!hasProductTable) {
      console.log('📝 Creating product table...');
      await db.schema.createTable('product', (t) => {
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
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ product table created');
    } else {
      console.log('⏭️  product table sudah ada');
    }

    // Order table
    const hasOrderTable = await db.schema.hasTable('order');
    if (!hasOrderTable) {
      console.log('📝 Creating order table...');
      await db.schema.createTable('order', (t) => {
        t.string('id').primary();
        t.string('orderNumber').unique();
        t.string('userId').nullable();
        t.string('guestEmail').nullable();
        t.decimal('totalAmount', 10, 2).defaultTo(0);
        t.string('paymentMethod').nullable();
        t.string('status').defaultTo('pending');
        t.text('shippingAddress').nullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ order table created');
    } else {
      console.log('⏭️  order table sudah ada');
    }

    // Order Item table
    const hasOrderItemTable = await db.schema.hasTable('orderItem');
    if (!hasOrderItemTable) {
      console.log('📝 Creating orderItem table...');
      await db.schema.createTable('orderItem', (t) => {
        t.string('id').primary();
        t.string('orderId');
        t.string('productId');
        t.integer('quantity').defaultTo(1);
        t.decimal('unitPrice', 10, 2).defaultTo(0);
        t.decimal('subtotal', 10, 2).defaultTo(0);
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });
      console.log('✅ orderItem table created');
    } else {
      console.log('⏭️  orderItem table sudah ada');
    }

    // Payment table
    const hasPaymentTable = await db.schema.hasTable('payment');
    if (!hasPaymentTable) {
      console.log('📝 Creating payment table...');
      await db.schema.createTable('payment', (t) => {
        t.string('id').primary();
        t.string('orderId');
        t.decimal('amount', 10, 2).defaultTo(0);
        t.string('method');
        t.string('status');
        t.string('transactionId').nullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ payment table created');
    } else {
      console.log('⏭️  payment table sudah ada');
    }

    // Order Status History table
    const hasStatusHistoryTable = await db.schema.hasTable('orderStatusHistory');
    if (!hasStatusHistoryTable) {
      console.log('📝 Creating orderStatusHistory table...');
      await db.schema.createTable('orderStatusHistory', (t) => {
        t.string('id').primary();
        t.string('orderId');
        t.string('previousStatus').nullable();
        t.string('newStatus');
        t.string('reason').nullable();
        t.string('updatedBy').nullable();
        t.text('notes').nullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });
      console.log('✅ orderStatusHistory table created');
    } else {
      console.log('⏭️  orderStatusHistory table sudah ada');
    }

    // Order Tracking table
    const hasTrackingTable = await db.schema.hasTable('orderTracking');
    if (!hasTrackingTable) {
      console.log('📝 Creating orderTracking table...');
      await db.schema.createTable('orderTracking', (t) => {
        t.string('id').primary();
        t.string('orderId');
        t.string('trackingNumber').nullable();
        t.string('courier').nullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });
      console.log('✅ orderTracking table created');
    } else {
      console.log('⏭️  orderTracking table sudah ada');
    }

    // Order Notification table
    const hasNotificationTable = await db.schema.hasTable('orderNotification');
    if (!hasNotificationTable) {
      console.log('📝 Creating orderNotification table...');
      await db.schema.createTable('orderNotification', (t) => {
        t.string('id').primary();
        t.string('orderId');
        t.string('userId').nullable();
        t.string('recipientEmail').nullable();
        t.string('type');
        t.string('title');
        t.text('message');
        t.boolean('emailSent').defaultTo(false);
        t.text('payload').nullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });
      console.log('✅ orderNotification table created');
    } else {
      console.log('⏭️  orderNotification table sudah ada');
    }

    // Customer Profile table
    const hasCustomerProfileTable = await db.schema.hasTable('customerProfile');
    if (!hasCustomerProfileTable) {
      console.log('📝 Creating customerProfile table...');
      await db.schema.createTable('customerProfile', (t) => {
        t.string('id').primary();
        t.string('userId').references('id').inTable('user').onDelete('CASCADE');
        t.text('address').nullable();
        t.string('city').nullable();
        t.string('postalCode').nullable();
        t.string('province').nullable();
        t.boolean('emailPromo').defaultTo(true);
        t.boolean('emailOrderUpdates').defaultTo(true);
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ customerProfile table created');
    } else {
      console.log('⏭️  customerProfile table sudah ada, checking columns...');
      const hasPromoCol = await db.schema.hasColumn('customerProfile', 'emailPromo');
      if (!hasPromoCol) {
        await db.schema.alterTable('customerProfile', t => {
          t.boolean('emailPromo').defaultTo(true);
          t.boolean('emailOrderUpdates').defaultTo(true);
        });
        console.log('✅ customerProfile table altered: added email preferences');
      }
    }

    // Design Request table
    const hasDesignRequestTable = await db.schema.hasTable('designRequest');
    if (!hasDesignRequestTable) {
      console.log('📝 Creating designRequest table...');
      await db.schema.createTable('designRequest', (t) => {
        t.string('id').primary();
        t.string('userId').references('id').inTable('user').onDelete('CASCADE');
        t.string('orderId').nullable();
        t.string('designTitle');
        t.text('designDescription').nullable();
        t.string('referenceImageUrl').nullable();
        t.string('designFileUrl').nullable();
        t.string('fileType').nullable();
        t.integer('quantity').defaultTo(1);
        t.string('productTypeForSablon').nullable();
        t.string('colorPreferences').nullable();
        t.date('deadline').nullable();
        t.string('status').defaultTo('DRAFT');
        t.timestamp('submittedAt').nullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ designRequest table created');
    } else {
      console.log('⏭️  designRequest table sudah ada');
    }

    // Customer Metrics table
    const hasCustomerMetricsTable = await db.schema.hasTable('customerMetrics');
    if (!hasCustomerMetricsTable) {
      console.log('📝 Creating customerMetrics table...');
      await db.schema.createTable('customerMetrics', (t) => {
        t.string('id').primary();
        t.string('userId').references('id').inTable('user').onDelete('CASCADE');
        t.integer('totalOrders').defaultTo(0);
        t.decimal('totalSpent', 10, 2).defaultTo(0);
        t.timestamp('lastOrderDate').nullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ customerMetrics table created');
    } else {
      console.log('⏭️  customerMetrics table sudah ada');
    }

    // Shopping Cart table
    const hasShoppingCartTable = await db.schema.hasTable('shoppingCart');
    if (!hasShoppingCartTable) {
      console.log('📝 Creating shoppingCart table...');
      await db.schema.createTable('shoppingCart', (t) => {
        t.string('id').primary();
        t.string('userId').references('id').inTable('user').onDelete('CASCADE');
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ shoppingCart table created');
    } else {
      console.log('⏭️  shoppingCart table sudah ada');
    }

    // Wishlist table
    const hasWishlistTable = await db.schema.hasTable('wishlist');
    if (!hasWishlistTable) {
      console.log('📝 Creating wishlist table...');
      await db.schema.createTable('wishlist', (t) => {
        t.string('id').primary();
        t.string('userId').references('id').inTable('user').onDelete('CASCADE');
        t.string('productId').references('id').inTable('product').onDelete('CASCADE');
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });
      console.log('✅ wishlist table created');
    } else {
      console.log('⏭️  wishlist table sudah ada');
    }

    // Point History table
    const hasPointHistoryTable = await db.schema.hasTable('pointHistory');
    if (!hasPointHistoryTable) {
      console.log('📝 Creating pointHistory table...');
      await db.schema.createTable('pointHistory', (t) => {
        t.string('id').primary();
        t.string('userId'); // Removed foreign key constraint to prevent MySQL type mismatch
        t.integer('points').notNullable();
        t.string('type').notNullable(); // EARNED or SPENT
        t.string('description').notNullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });
      console.log('✅ pointHistory table created');
    } else {
      console.log('⏭️  pointHistory table sudah ada');
    }

    console.log('\n✅ Production schema setup complete!');
  } catch (err) {
    console.error('❌ Schema setup failed:', err.message);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
}

setupSchema();

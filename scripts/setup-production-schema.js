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
      console.log('⏭️  user table sudah ada, checking columns...');
      const hasRewardPoints = await db.schema.hasColumn('user', 'rewardPoints');
      const hasEmailVerified = await db.schema.hasColumn('user', 'emailVerified');
      
      if (!hasRewardPoints || !hasEmailVerified) {
        await db.schema.alterTable('user', (t) => {
          if (!hasRewardPoints) {
            console.log('   ➕ adding rewardPoints column');
            t.integer('rewardPoints').defaultTo(0);
          }
          if (!hasEmailVerified) {
            console.log('   ➕ adding emailVerified column');
            t.boolean('emailVerified').defaultTo(false);
          }
        });
        console.log('✅ user table updated with missing columns');
      }

      const hasPhone = await db.schema.hasColumn('user', 'phone');
      if (!hasPhone) {
        await db.schema.alterTable('user', (t) => {
          console.log('   ➕ adding phone column');
          t.string('phone').nullable();
        });
        console.log('✅ user table updated with phone column');
      }
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

    // Product Type Master table
    const hasProductTypeTable = await db.schema.hasTable('product_type_master');
    if (!hasProductTypeTable) {
      console.log('📝 Creating product_type_master table...');
      await db.schema.createTable('product_type_master', (t) => {
        t.string('id').primary();
        t.string('typeName');
        t.string('slug').unique();
        t.string('imageUrl').nullable();
        t.boolean('isActive').defaultTo(true);
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ product_type_master table created');
    } else {
      console.log('⏭️  product_type_master table sudah ada');
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
        t.boolean('isRead').defaultTo(false);
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });
      console.log('✅ orderNotification table created');
    } else {
      console.log('⏭️  orderNotification table sudah ada, checking columns...');
      const hasIsReadCol = await db.schema.hasColumn('orderNotification', 'isRead');
      if (!hasIsReadCol) {
        await db.schema.alterTable('orderNotification', t => {
          t.boolean('isRead').defaultTo(false);
        });
        console.log('✅ orderNotification table altered: added isRead');
      }
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
        t.string('mockupPreviewUrl').nullable();
        t.string('fileType').nullable();
        t.integer('quantity').defaultTo(1);
        t.string('productTypeForSablon').nullable();
        t.string('printTechnique').nullable();
        t.integer('numberOfColors').nullable();
        t.decimal('estimatedPrice', 10, 2).nullable();
        t.string('printSize').nullable();
        t.string('printPosition').nullable();
        t.string('colorPreferences').nullable();
        t.text('sizeBreakdown').nullable();
        t.string('picName').nullable();
        t.string('whatsappNumber').nullable();
        t.date('deadline').nullable();
        t.string('status').defaultTo('DRAFT');
        t.timestamp('submittedAt').nullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ designRequest table created');
    } else {
      console.log('⏭️  designRequest table sudah ada, checking columns...');
      const hasMockupPreviewUrl = await db.schema.hasColumn('designRequest', 'mockupPreviewUrl');
      if (!hasMockupPreviewUrl) {
        await db.schema.alterTable('designRequest', (t) => {
          t.string('mockupPreviewUrl').nullable();
          t.string('printTechnique').nullable();
          t.integer('numberOfColors').nullable();
          t.decimal('estimatedPrice', 10, 2).nullable();
          t.string('printSize').nullable();
          t.string('printPosition').nullable();
          t.text('sizeBreakdown').nullable();
          t.string('picName').nullable();
          t.string('whatsappNumber').nullable();
        });
        console.log('✅ designRequest table altered: added missing columns');
      }
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

    // Push Subscriptions table
    const hasPushSubscriptionsTable = await db.schema.hasTable('pushSubscriptions');
    if (!hasPushSubscriptionsTable) {
      console.log('📝 Creating pushSubscriptions table...');
      await db.schema.createTable('pushSubscriptions', (t) => {
        t.increments('id').primary();
        t.string('userId').notNullable();
        t.text('endpoint').notNullable();
        t.text('p256dh').notNullable();
        t.text('auth').notNullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });
      console.log('✅ pushSubscriptions table created');
    } else {
      console.log('⏭️  pushSubscriptions table sudah ada');
    }

    // System Activity table
    const hasSystemActivityTable = await db.schema.hasTable('system_activity');
    if (!hasSystemActivityTable) {
      console.log('📝 Creating system_activity table...');
      await db.schema.createTable('system_activity', (t) => {
        t.string('id').primary();
        t.string('action');
        t.string('entityType');
        t.string('entityId');
        t.text('details');
        t.string('userId').nullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });
      console.log('✅ system_activity table created');
    }

    // Audit Log table
    const hasAuditLogTable = await db.schema.hasTable('auditLog');
    if (!hasAuditLogTable) {
      console.log('📝 Creating auditLog table...');
      await db.schema.createTable('auditLog', (t) => {
        t.string('id').primary();
        t.string('action');
        t.string('entity');
        t.string('entityId');
        t.string('userId');
        t.text('details');
        t.string('ipAddress').nullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });
      console.log('✅ auditLog table created');
    }

    // Store Settings table
    const hasStoreSettingsTable = await db.schema.hasTable('store_settings');
    if (!hasStoreSettingsTable) {
      console.log('📝 Creating store_settings table...');
      await db.schema.createTable('store_settings', (t) => {
        t.string('settingKey').primary();
        t.text('settingValue');
      });
      console.log('✅ store_settings table created');
    }

    // Hero Banners table
    const hasHeroBannersTable = await db.schema.hasTable('hero_banners');
    if (!hasHeroBannersTable) {
      console.log('📝 Creating hero_banners table...');
      await db.schema.createTable('hero_banners', (t) => {
        t.string('id').primary();
        t.string('page_location').defaultTo('home');
        t.string('imageUrl');
        t.string('title').nullable();
        t.string('subtitle').nullable();
        t.string('buttonText').nullable();
        t.string('buttonLink').nullable();
        t.boolean('isActive').defaultTo(true);
        t.integer('orderIndex').defaultTo(0);
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ hero_banners table created');
    }

    // Collection table
    const hasCollectionTable = await db.schema.hasTable('collection');
    if (!hasCollectionTable) {
      console.log('📝 Creating collection table...');
      await db.schema.createTable('collection', (t) => {
        t.string('id').primary();
        t.string('name');
        t.string('slug').unique();
        t.text('description').nullable();
        t.string('imageUrl').nullable();
        t.text('longDescription').nullable();
        t.string('purpose').nullable();
        t.text('highlights').nullable();
        t.text('useCases').nullable();
        t.boolean('isActive').defaultTo(true);
        t.boolean('is_featured').defaultTo(false);
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ collection table created');
    }

    // Product Collection table
    const hasProductCollectionTable = await db.schema.hasTable('product_collection');
    if (!hasProductCollectionTable) {
      console.log('📝 Creating product_collection table...');
      await db.schema.createTable('product_collection', (t) => {
        t.string('collectionId').references('id').inTable('collection').onDelete('CASCADE');
        t.string('productId').references('id').inTable('product').onDelete('CASCADE');
        t.primary(['collectionId', 'productId']);
      });
      console.log('✅ product_collection table created');
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

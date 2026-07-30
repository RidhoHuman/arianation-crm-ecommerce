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
        t.text('description');
        t.string('imageUrl');
        t.text('longDescription');
        t.string('purpose');
        t.text('highlights');
        t.text('useCases');
        t.boolean('isActive').defaultTo(true);
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ productCategory table created');
    } else {
      console.log('⏭️  productCategory table sudah ada, checking columns...');
      const hasDesc = await db.schema.hasColumn('productCategory', 'description');
      if (!hasDesc) {
        await db.schema.alterTable('productCategory', (t) => {
          t.text('description');
          t.string('imageUrl');
          t.text('longDescription');
          t.string('purpose');
          t.text('highlights');
          t.text('useCases');
          t.boolean('isActive').defaultTo(true);
        });
        console.log('✅ Added missing columns to productCategory');
      }
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
        t.string('categoryId').references('id').inTable('productCategory').onDelete('SET NULL');
        t.string('productName');
        t.text('description');
        t.text('descriptionEn').nullable();
        t.decimal('price', 10, 2);
        t.integer('stockQuantity').defaultTo(0);
        t.string('productType');
        t.string('productTypeId').nullable();
        t.string('imageUrl');
        t.string('businessType');
        t.boolean('isActive').defaultTo(true);
        t.string('tags').nullable();
        t.boolean('isSale').defaultTo(false);
        t.decimal('salePrice', 10, 2).nullable();
        t.text('imageUrls').nullable();
        t.boolean('trackStock').defaultTo(true);
        t.text('allowedPrintAreas').nullable();
        t.integer('weight_gram').nullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ product table created');
    } else {
      console.log('⏭️  product table sudah ada, checking columns...');
      const columnsToCheck = ['tags', 'isSale', 'salePrice', 'imageUrls', 'trackStock', 'allowedPrintAreas', 'weight_gram', 'descriptionEn'];
      
      const missingColumns = [];
      for (const col of columnsToCheck) {
        const hasCol = await db.schema.hasColumn('product', col);
        if (!hasCol) missingColumns.push(col);
      }

      if (missingColumns.length > 0) {
        await db.schema.alterTable('product', (t) => {
          if (missingColumns.includes('tags')) {
            console.log('   ➕ adding tags column');
            t.string('tags').nullable();
          }
          if (missingColumns.includes('isSale')) {
            console.log('   ➕ adding isSale column');
            t.boolean('isSale').defaultTo(false);
          }
          if (missingColumns.includes('salePrice')) {
            console.log('   ➕ adding salePrice column');
            t.decimal('salePrice', 10, 2).nullable();
          }
          if (missingColumns.includes('imageUrls')) {
            console.log('   ➕ adding imageUrls column');
            t.text('imageUrls').nullable();
          }
          if (missingColumns.includes('trackStock')) {
            console.log('   ➕ adding trackStock column');
            t.boolean('trackStock').defaultTo(true);
          }
          if (missingColumns.includes('allowedPrintAreas')) {
            console.log('   ➕ adding allowedPrintAreas column');
            t.text('allowedPrintAreas').nullable();
          }
          if (missingColumns.includes('weight_gram')) {
            console.log('   ➕ adding weight_gram column');
            t.integer('weight_gram').nullable();
          }
          if (missingColumns.includes('descriptionEn')) {
            console.log('   ➕ adding descriptionEn column');
            t.text('descriptionEn').nullable();
          }
        });
        console.log('✅ product table updated with missing columns');
      }
    }

    // Product Variant table
    const hasProductVariantTable = await db.schema.hasTable('productVariant');
    if (!hasProductVariantTable) {
      console.log('📝 Creating productVariant table...');
      await db.schema.createTable('productVariant', (t) => {
        t.string('id').primary();
        t.string('productId').references('id').inTable('product').onDelete('CASCADE');
        t.string('variantName');
        t.string('color').nullable();
        t.string('colorCode').nullable();
        t.string('imageUrl').nullable();
        t.string('imageUrlBack').nullable();
        t.string('imageUrlLeft').nullable();
        t.string('imageUrlRight').nullable();
        t.integer('stockQuantity').defaultTo(0);
        t.string('sku').nullable();
        t.decimal('additionalPrice', 10, 2).defaultTo(0);
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ productVariant table created');
    } else {
      console.log('⏭️  productVariant table sudah ada');
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
    const hasOrderNotificationTable = await db.schema.hasTable('orderNotification');
    if (!hasOrderNotificationTable) {
      console.log('📝 Creating orderNotification table...');
      await db.schema.createTable('orderNotification', (t) => {
        t.string('id').primary();
        t.string('orderId').references('id').inTable('order').onDelete('CASCADE');
        t.string('type').notNullable();
        t.text('message').notNullable();
        t.string('status').defaultTo('pending');
        t.integer('retryCount').defaultTo(0);
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ orderNotification table created');
    } else {
      console.log('⏭️  orderNotification table sudah ada, checking columns...');
      const hasRetryCount = await db.schema.hasColumn('orderNotification', 'retryCount');
      if (!hasRetryCount) {
        await db.schema.alterTable('orderNotification', (t) => {
          t.integer('retryCount').defaultTo(0);
        });
        console.log('   ➕ added retryCount to orderNotification');
      }
    }

    // Customer Notification table
    const hasCustomerNotificationTable = await db.schema.hasTable('customerNotification');
    if (!hasCustomerNotificationTable) {
      console.log('📝 Creating customerNotification table...');
      await db.schema.createTable('customerNotification', (t) => {
        t.string('id').primary();
        t.string('userId');
        t.string('title');
        t.text('message');
        t.string('type').defaultTo('general');
        t.boolean('isRead').defaultTo(false);
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });
      console.log('✅ customerNotification table created');
    } else {
      console.log('⏭️  customerNotification table sudah ada');
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

    // Sablon Portfolio table
    const hasSablonPortfolioTable = await db.schema.hasTable('sablon_portfolio');
    if (!hasSablonPortfolioTable) {
      console.log('📝 Creating sablon_portfolio table...');
      await db.schema.createTable('sablon_portfolio', (t) => {
        t.increments('id').primary();
        t.string('title').notNullable();
        t.string('category').notNullable();
        t.string('imageUrl').notNullable();
        t.boolean('isActive').defaultTo(true);
        t.integer('sortOrder').defaultTo(0);
        t.timestamp('created_at').defaultTo(db.fn.now());
        t.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('✅ sablon_portfolio table created');
    } else {
      console.log('⏭️  sablon_portfolio table sudah ada');
    }

    // Print Techniques table
    const hasPrintTechniquesTable = await db.schema.hasTable('print_techniques');
    if (!hasPrintTechniquesTable) {
      console.log('📝 Creating print_techniques table...');
      await db.schema.createTable('print_techniques', (t) => {
        t.string('id').primary();
        t.string('name').notNullable();
        t.text('description').nullable();
        t.text('allowedCategories').defaultTo('[]'); // JSON string
        t.integer('minOrder').defaultTo(1);
        t.string('pricingType').defaultTo('fixed');
        t.decimal('basePrice', 10, 2).defaultTo(0);
        t.text('priceMatrix').nullable(); // JSON string
        t.integer('maxColors').nullable();
        t.string('imageUrl').nullable();
        t.boolean('isActive').defaultTo(true);
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ print_techniques table created');
    } else {
      console.log('⏭️  print_techniques table sudah ada');
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

    // Purchase Orders (PO) table
    const hasPoOrdersTable = await db.schema.hasTable('po_orders');
    if (!hasPoOrdersTable) {
      console.log('📝 Creating po_orders table...');
      await db.schema.createTable('po_orders', (t) => {
        t.increments('id').primary();
        t.string('orderNumber').notNullable();
        t.string('productId').references('id').inTable('product').onDelete('CASCADE');
        t.integer('quantity').notNullable();
        t.integer('quantityReceived').defaultTo(0);
        t.string('supplierName').notNullable();
        t.string('status').defaultTo('pending');
        t.string('paymentStatus').defaultTo('unpaid');
        t.timestamp('estimatedDelivery').nullable();
        t.timestamp('actualDelivery').nullable();
        t.text('notes').nullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ po_orders table created');
    } else {
      console.log('⏭️  po_orders table sudah ada');
    }

    // Inventory Log table
    const hasInventoryLogTable = await db.schema.hasTable('inventory_log');
    if (!hasInventoryLogTable) {
      console.log('📝 Creating inventory_log table...');
      await db.schema.createTable('inventory_log', (t) => {
        t.increments('id').primary();
        t.string('productId').references('id').inTable('product').onDelete('CASCADE');
        t.integer('change').notNullable();
        t.string('type').notNullable();
        t.string('reason').nullable();
        t.string('referenceId').nullable();
        t.string('referenceType').nullable();
        t.string('changedBy').nullable();
        t.integer('stockBefore').notNullable();
        t.integer('stockAfter').notNullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ inventory_log table created');
    } else {
      console.log('⏭️  inventory_log table sudah ada');
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

    // Cart Item table
    const hasCartItemTable = await db.schema.hasTable('cartItem');
    if (!hasCartItemTable) {
      console.log('📝 Creating cartItem table...');
      await db.schema.createTable('cartItem', (t) => {
        t.string('id').primary();
        t.string('cartId').references('id').inTable('shoppingCart').onDelete('CASCADE');
        t.string('productId').references('id').inTable('product').onDelete('CASCADE');
        t.string('variantId').nullable();
        t.integer('quantity').defaultTo(1);
        t.decimal('price', 10, 2).notNullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ cartItem table created');
    } else {
      console.log('⏭️  cartItem table sudah ada');
    }

    // Admin Notifications table
    const hasAdminNotificationsTable = await db.schema.hasTable('admin_notifications');
    if (!hasAdminNotificationsTable) {
      console.log('📝 Creating admin_notifications table...');
      await db.schema.createTable('admin_notifications', (t) => {
        t.increments('id').primary();
        t.string('type').notNullable();
        t.string('title').notNullable();
        t.text('message').notNullable();
        t.boolean('isRead').defaultTo(false);
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ admin_notifications table created');
    } else {
      console.log('⏭️  admin_notifications table sudah ada');
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

    // Voucher table
    const hasVoucherTable = await db.schema.hasTable('voucher');
    if (!hasVoucherTable) {
      console.log('📝 Creating voucher table...');
      await db.schema.createTable('voucher', (t) => {
        t.string('id').primary();
        t.string('code').unique().notNullable();
        t.string('type').notNullable(); // PERCENTAGE or FIXED
        t.decimal('value', 10, 2).notNullable();
        t.decimal('minPurchase', 10, 2).defaultTo(0);
        t.decimal('maxDiscount', 10, 2).defaultTo(0);
        t.integer('usageLimit').nullable();
        t.integer('usedCount').defaultTo(0);
        t.boolean('isActive').defaultTo(true);
        t.timestamp('expiresAt').nullable();
        t.string('targetTier').defaultTo('ALL');
        t.boolean('isPublic').defaultTo(true);
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ voucher table created');
    } else {
      console.log('⏭️  voucher table sudah ada');
    }

    // Newsletter Subscribers table
    const hasNewsletterSubscribersTable = await db.schema.hasTable('newsletter_subscribers');
    if (!hasNewsletterSubscribersTable) {
      console.log('📝 Creating newsletter_subscribers table...');
      await db.schema.createTable('newsletter_subscribers', (t) => {
        t.increments('id').primary();
        t.string('email').unique().notNullable();
        t.boolean('isActive').defaultTo(true);
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ newsletter_subscribers table created');
    } else {
      console.log('⏭️  newsletter_subscribers table sudah ada');
    }

    // Couriers table
    const hasCouriersTable = await db.schema.hasTable('couriers');
    if (!hasCouriersTable) {
      console.log('📝 Creating couriers table...');
      await db.schema.createTable('couriers', (t) => {
        t.string('code').primary();
        t.string('name').notNullable();
        t.boolean('isActive').defaultTo(true);
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ couriers table created');
    } else {
      console.log('⏭️  couriers table sudah ada');
    }

    // Sync default couriers
    const defaultCouriers = [
      { code: 'jne', name: 'JNE', isActive: true },
      { code: 'pos', name: 'POS Indonesia', isActive: true },
      { code: 'tiki', name: 'TIKI', isActive: true },
      { code: 'jnt', name: 'J&T Express', isActive: true },
      { code: 'sicepat', name: 'SiCepat', isActive: true },
      { code: 'anteraja', name: 'AnterAja', isActive: true },
      { code: 'ninja', name: 'Ninja Xpress', isActive: true },
      { code: 'gojek', name: 'Gojek / GoSend', isActive: true },
      { code: 'grab', name: 'GrabExpress', isActive: true },
      { code: 'idexpress', name: 'ID Express', isActive: true },
      { code: 'lion', name: 'Lion Parcel', isActive: true },
      { code: 'paxel', name: 'Paxel', isActive: true },
      { code: 'sap', name: 'SAP Express', isActive: true },
      { code: 'wahana', name: 'Wahana', isActive: true }
    ];

    for (const courier of defaultCouriers) {
      const exists = await db('couriers').where('code', courier.code).first();
      if (!exists) {
        await db('couriers').insert(courier);
        console.log(`✅ Courier ${courier.name} inserted`);
      }
    }

    // Product Review table
    const hasProductReviewTable = await db.schema.hasTable('product_review');
    if (!hasProductReviewTable) {
      console.log('📝 Creating product_review table...');
      await db.schema.createTable('product_review', (t) => {
        t.increments('id').primary();
        t.string('productId').notNullable();
        t.string('userId').notNullable();
        t.string('orderId').notNullable();
        t.integer('rating').notNullable();
        t.text('comment').notNullable();
        t.string('imageUrl').nullable();
        t.integer('pointsAwarded').defaultTo(0);
        t.boolean('isVerified').defaultTo(true);
        t.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('✅ product_review table created');
    } else {
      console.log('⏭️  product_review table sudah ada');
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

    // Portfolio Items table
    const hasPortfolioTable = await db.schema.hasTable('portfolio_items');
    if (!hasPortfolioTable) {
      console.log('📝 Creating portfolio_items table...');
      await db.schema.createTable('portfolio_items', (t) => {
        t.increments('id').primary();
        t.string('title').notNullable();
        t.string('category').notNullable();
        t.string('image').notNullable();
        t.boolean('isActive').defaultTo(true);
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ portfolio_items table created');
    }

    // FAQ Items table
    const hasFaqTable = await db.schema.hasTable('faq_items');
    if (!hasFaqTable) {
      console.log('📝 Creating faq_items table...');
      await db.schema.createTable('faq_items', (t) => {
        t.increments('id').primary();
        t.text('question').notNullable();
        t.text('answer').notNullable();
        t.integer('orderIndex').defaultTo(0);
        t.boolean('isActive').defaultTo(true);
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('✅ faq_items table created');
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

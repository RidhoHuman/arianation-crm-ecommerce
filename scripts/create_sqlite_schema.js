// scripts/create_sqlite_schema.js
// Script synchronous helper to create sqlite schema for tests.
const path = require('path');
const dotenv = require('dotenv');
const envFile = path.resolve(process.cwd(), '.env.test');
dotenv.config({ path: envFile });

const knexLib = require('knex');

(async () => {
  const dbFile = path.resolve(process.cwd(), process.env.SQLITE_FILE || './db/test.sqlite3');
  const fs = require('fs');
  const dbDir = path.dirname(dbFile);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  if (fs.existsSync(dbFile)) {
    try {
      fs.unlinkSync(dbFile);
    } catch (e) {
      // Ignore unlink errors in setup if it's already deleted or locked by same process
    }
  }

  const db = knexLib({
    client: 'sqlite3',
    connection: { filename: dbFile },
    useNullAsDefault: true,
  });

  try {
    const has = (name) => db.schema.hasTable(name);

    if (!(await has('user')))
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

    if (!(await has('productCategory')))
      await db.schema.createTable('productCategory', (t) => {
        t.string('id').primary();
        t.string('categoryName');
        t.string('businessType');
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });

    if (!(await has('category'))) // Add category alias for older code
      await db.schema.createTable('category', (t) => {
        t.string('id').primary();
        t.string('categoryName');
        t.string('businessType');
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });

    if (!(await has('product')))
      await db.schema.createTable('product', (t) => {
        t.string('id').primary();
        t.string('categoryId');
        t.string('productName');
        t.decimal('price', 10, 2).defaultTo(0);
        t.integer('stockQuantity').defaultTo(0);
        t.string('productType');
        t.string('productTypeId').nullable();
        t.string('businessType');
        t.string('imageUrl').nullable();
        t.text('imageUrls').nullable();
        t.text('description').nullable();
        t.text('descriptionEn').nullable();
        t.boolean('isActive').defaultTo(true);
        t.text('tags').nullable();
        t.boolean('isSale').defaultTo(false);
        t.decimal('salePrice', 10, 2).nullable();
        t.text('allowedPrintAreas').nullable();
        t.integer('weight_gram').nullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });

    if (!(await has('productVariant')))
      await db.schema.createTable('productVariant', (t) => {
        t.string('id').primary();
        t.string('productId');
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

    if (!(await has('order')))
      await db.schema.createTable('order', (t) => {
        t.string('id').primary();
        t.string('orderNumber').unique();
        t.string('userId').nullable();
        t.string('guestEmail').nullable();
        t.decimal('totalAmount', 10, 2).defaultTo(0);
        t.decimal('totalItemPrice', 10, 2).defaultTo(0);
        t.string('paymentMethod').nullable();
        t.string('paymentOption').nullable();
        t.string('status').defaultTo('pending');
        t.text('shippingAddress').nullable();
        t.text('deliveryAddress').nullable();
        t.decimal('shippingCost', 10, 2).defaultTo(0);
        t.string('shippingCourier').nullable();
        t.text('refundDetails').nullable();
        t.string('trackingNumber').nullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });

    if (!(await has('orderItem')))
      await db.schema.createTable('orderItem', (t) => {
        t.string('id').primary();
        t.string('orderId');
        t.string('productId');
        t.integer('quantity').defaultTo(1);
        t.decimal('unitPrice', 10, 2).defaultTo(0);
        t.decimal('subtotal', 10, 2).defaultTo(0);
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });

    if (!(await has('payment')))
      await db.schema.createTable('payment', (t) => {
        t.string('id').primary();
        t.string('orderId');
        t.decimal('amount', 10, 2).defaultTo(0);
        t.string('method');
        t.string('status');
        t.string('transactionId').nullable();
        t.string('qrisUrl').nullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });

    if (!(await has('orderStatusHistory')))
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

    if (!(await has('orderTracking')))
      await db.schema.createTable('orderTracking', (t) => {
        t.string('id').primary();
        t.string('orderId');
        t.string('trackingNumber').nullable();
        t.string('courier').nullable();
        t.timestamp('updatedAt').defaultTo(db.fn.now());
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });

    if (!(await has('orderNotification')))
      await db.schema.createTable('orderNotification', (t) => {
        t.string('id').primary();
        t.string('orderId');
        t.string('userId').nullable();
        t.string('recipientEmail').nullable();
        t.string('type');
        t.string('title');
        t.text('message');
        t.boolean('emailSent').defaultTo(false);
        t.boolean('isRead').defaultTo(false);
        t.text('payload').nullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });

    if (!(await has('customerProfile')))
      await db.schema.createTable('customerProfile', (t) => {
        t.string('id').primary();
        t.string('userId');
        t.text('address').nullable();
        t.string('city').nullable();
        t.string('postalCode').nullable();
        t.string('province').nullable();
        t.boolean('emailPromo').defaultTo(true);
        t.boolean('emailOrderUpdates').defaultTo(true);
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });

    if (!(await has('designRequest')))
      await db.schema.createTable('designRequest', (t) => {
        t.string('id').primary();
        t.string('userId');
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

    if (!(await has('customerMetrics')))
      await db.schema.createTable('customerMetrics', (t) => {
        t.string('id').primary();
        t.string('userId');
        t.integer('totalOrders').defaultTo(0);
        t.decimal('totalSpent', 10, 2).defaultTo(0);
        t.timestamp('lastOrderDate').nullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });

    if (!(await has('shoppingCart')))
      await db.schema.createTable('shoppingCart', (t) => {
        t.string('id').primary();
        t.string('userId');
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });

    if (!(await has('wishlist')))
      await db.schema.createTable('wishlist', (t) => {
        t.string('id').primary();
        t.string('userId');
        t.string('productId');
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });

    if (!(await has('pointHistory')))
      await db.schema.createTable('pointHistory', (t) => {
        t.string('id').primary();
        t.string('userId');
        t.integer('points').notNullable();
        t.string('type').notNullable();
        t.string('description').notNullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });

    if (!(await has('pushSubscriptions')))
      await db.schema.createTable('pushSubscriptions', (t) => {
        t.increments('id').primary();
        t.string('userId').notNullable();
        t.text('endpoint').notNullable();
        t.text('p256dh').notNullable();
        t.text('auth').notNullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });

    if (!(await has('system_activity')))
      await db.schema.createTable('system_activity', (t) => {
        t.string('id').primary();
        t.string('action');
        t.string('entityType');
        t.string('entityId');
        t.text('details');
        t.string('userId').nullable();
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });

    console.log('✅ create_sqlite_schema: done', dbFile);
  } catch (err) {
    console.error('❌ create_sqlite_schema error:', err.message);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
})();

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

    if (!(await has('product')))
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

    if (!(await has('order')))
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
        t.text('payload').nullable();
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

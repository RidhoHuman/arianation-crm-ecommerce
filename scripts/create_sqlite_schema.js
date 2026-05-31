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
    fs.unlinkSync(dbFile);
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
        t.string('email');
        t.string('password');
        t.string('fullName');
        t.string('role');
        t.boolean('isActive').defaultTo(true);
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
        t.boolean('isActive').defaultTo(true);
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });

    if (!(await has('order')))
      await db.schema.createTable('order', (t) => {
        t.string('id').primary();
        t.string('orderNumber');
        t.string('userId');
        t.decimal('totalAmount', 10, 2).defaultTo(0);
        t.string('paymentMethod');
        t.string('status');
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
        t.string('transactionId');
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('updatedAt').defaultTo(db.fn.now());
      });

    if (!(await has('orderStatusHistory')))
      await db.schema.createTable('orderStatusHistory', (t) => {
        t.string('id').primary();
        t.string('orderId');
        t.string('previousStatus');
        t.string('newStatus');
        t.string('reason');
        t.string('updatedBy');
        t.text('notes');
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });

    if (!(await has('orderTracking')))
      await db.schema.createTable('orderTracking', (t) => {
        t.string('id').primary();
        t.string('orderId');
        t.string('trackingNumber');
        t.string('courier');
        t.timestamp('createdAt').defaultTo(db.fn.now());
      });

    if (!(await has('orderNotification')))
      await db.schema.createTable('orderNotification', (t) => {
        t.string('id').primary();
        t.string('orderId');
        t.string('userId');
        t.string('recipientEmail');
        t.string('type');
        t.string('title');
        t.text('message');
        t.boolean('emailSent').defaultTo(false);
        t.text('payload');
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

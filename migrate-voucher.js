require('dotenv').config();
const knex = require('./src/config/knex');

async function migrate() {
  try {
    console.log('🔄 Checking if voucher table exists...');
    const hasVoucher = await knex.schema.hasTable('voucher');
    
    if (!hasVoucher) {
      console.log('📝 Creating voucher table...');
      await knex.schema.createTable('voucher', (t) => {
        t.string('id').primary();
        t.string('code').unique().notNullable(); // e.g. WELCOME20
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
      });
      console.log('✅ voucher table created.');
    } else {
      console.log('✅ voucher table already exists.');
    }

    console.log('🔄 Checking order table for voucher columns...');
    const hasVoucherCode = await knex.schema.hasColumn('order', 'voucherCode');
    if (!hasVoucherCode) {
      console.log('📝 Adding voucher columns to order table...');
      await knex.schema.alterTable('order', (t) => {
        t.string('voucherCode').nullable();
        t.decimal('voucherDiscountAmount', 10, 2).defaultTo(0);
      });
      console.log('✅ Columns added successfully.');
    } else {
      console.log('✅ Columns already exist in order table.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit();
  }
}

migrate();

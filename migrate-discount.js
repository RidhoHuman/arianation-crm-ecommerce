require('dotenv').config();
const knex = require('./src/config/knex');

async function migrate() {
  try {
    console.log('🔄 Checking order table for tier discount columns...');
    const hasDiscountCol = await knex.schema.hasColumn('order', 'tierDiscountAmount');
    if (!hasDiscountCol) {
      console.log('📝 Adding tierDiscountAmount and tierDiscountPercentage to order table...');
      await knex.schema.alterTable('order', (t) => {
        t.decimal('tierDiscountAmount', 10, 2).defaultTo(0);
        t.integer('tierDiscountPercentage').defaultTo(0);
      });
      console.log('✅ Columns added successfully.');
    } else {
      console.log('✅ Columns already exist.');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit();
  }
}

migrate();

const knex = require('./src/config/knex');

async function migrate() {
  console.log('Starting migration: Adding refundDetails to order table...');

  try {
    const hasColumn = await knex.schema.hasColumn('order', 'refundDetails');

    if (!hasColumn) {
      await knex.schema.table('order', (table) => {
        table.json('refundDetails').nullable().comment('Stores bank account info for manual refunds');
      });
      console.log('Successfully added refundDetails column to order table.');
    } else {
      console.log('refundDetails column already exists.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();

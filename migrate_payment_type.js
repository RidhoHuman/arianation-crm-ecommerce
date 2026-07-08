const knex = require('./src/config/knex');

async function migrate() {
  try {
    const hasColumn = await knex.schema.hasColumn('payment', 'paymentType');
    if (!hasColumn) {
      await knex.schema.alterTable('payment', (table) => {
        table.string('paymentType').nullable().defaultTo('FULL');
      });
      console.log('Successfully added paymentType column to payment table');
    } else {
      console.log('Column paymentType already exists in payment table');
    }

    try {
      await knex.schema.alterTable('payment', (table) => {
        table.dropUnique('orderId');
      });
      console.log('Successfully dropped unique constraint on orderId');
    } catch (e) {
      console.log('Unique constraint on orderId may not exist or already dropped.', e.message);
    }
    
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    knex.destroy();
  }
}

migrate();

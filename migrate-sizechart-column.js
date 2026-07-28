require('dotenv').config();
const knex = require('./src/config/knex');

async function up() {
  try {
    const hasColumn = await knex.schema.hasColumn('product', 'sizeChartImage');
    if (!hasColumn) {
      await knex.schema.alterTable('product', (table) => {
        table.string('sizeChartImage', 255).nullable();
      });
      console.log('Successfully added sizeChartImage column to product table');
    } else {
      console.log('Column sizeChartImage already exists');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

up();

const knex = require('./src/config/knex');

async function migrate() {
  try {
    const hasColumn = await knex.schema.hasColumn('product', 'descriptionEn');
    if (!hasColumn) {
      console.log('Adding column descriptionEn to product table...');
      await knex.schema.alterTable('product', (table) => {
        table.text('descriptionEn').nullable();
      });
      console.log('✅ Column descriptionEn added successfully!');
    } else {
      console.log('Column descriptionEn already exists.');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    knex.destroy();
  }
}

migrate();

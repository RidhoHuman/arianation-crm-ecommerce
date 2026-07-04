require('dotenv').config();
const knex = require('./src/config/knex');

async function alterProductCategory() {
  try {
    const exists = await knex.schema.hasTable('productCategory');
    if (!exists) {
      console.log('Table productCategory does not exist.');
      process.exit(1);
    }

    const hasImageUrl = await knex.schema.hasColumn('productCategory', 'imageUrl');
    if (!hasImageUrl) {
      await knex.schema.alterTable('productCategory', (table) => {
        table.string('imageUrl').nullable();
        table.text('longDescription').nullable();
        table.string('purpose').nullable();
        table.json('highlights').nullable();
        table.json('useCases').nullable();
      });
      console.log('✅ Added dynamic content columns to productCategory.');
    } else {
      console.log('⚠️ Columns already exist in productCategory.');
    }
  } catch (error) {
    console.error('❌ Error altering productCategory:', error);
  } finally {
    process.exit(0);
  }
}

alterProductCategory();

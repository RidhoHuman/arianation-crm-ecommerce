require('dotenv').config();
const knex = require('./src/config/knex');

async function updateSchema() {
  try {
    const hasWeightGram = await knex.schema.hasColumn('product', 'weight_gram');
    if (!hasWeightGram) {
      await knex.schema.alterTable('product', t => {
        t.integer('weight_gram').nullable();
      });
      console.log('✅ Added weight_gram to product table');
    } else {
      console.log('Column weight_gram already exists.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await knex.destroy();
  }
}

updateSchema();

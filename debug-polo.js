require('dotenv').config();
const knex = require('./src/config/knex');

async function searchPolo() {
  try {
    const prods = await knex('product').where('productName', 'like', '%polo%');
    console.log('Polo products:', prods);
  } catch (error) {
    console.error(error);
  } finally {
    await knex.destroy();
  }
}

searchPolo();

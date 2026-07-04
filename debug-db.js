require('dotenv').config();
const knex = require('./src/config/knex');

async function dumpDB() {
  try {
    const cats = await knex('productCategory').select('*');
    console.log('Categories:', cats);
    const prods = await knex('product').select('id', 'categoryId', 'productName');
    console.log('Products:', prods);
  } catch (error) {
    console.error(error);
  } finally {
    await knex.destroy();
  }
}

dumpDB();

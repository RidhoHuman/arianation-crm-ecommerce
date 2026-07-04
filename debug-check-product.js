const knex = require('./src/config/knex');
const fs = require('fs');

async function checkProduct() {
  try {
    const id = 'cmqqnj9ho00000svaeggscr56';
    const product = await knex('product').where('id', id).first();
    fs.writeFileSync('debug-out.txt', `Product ID: ${product.id}\nProduct Name: ${product.productName}\nproductTypeId: ${product.productTypeId}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkProduct();

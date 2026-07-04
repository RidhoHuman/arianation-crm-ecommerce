const productService = require('./src/services/productService');

async function testUpdate() {
  try {
    const id = 'cmqqnj9ho00000svaeggscr56';
    const typeId = 'cmqptb0n600000stc0r37d7k6'; // valid product type id from the first logs? wait, let me use a query to find one.

    const knex = require('./src/config/knex');
    const firstType = await knex('product_type_master').first();
    if (!firstType) {
      console.log('No types found');
      process.exit(0);
    }
    
    console.log('Found type:', firstType.id);

    const updateData = {
      productTypeId: firstType.id
    };

    console.log('Calling update...');
    await productService.update(id, updateData);
    console.log('Update complete');

    const product = await knex('product').where('id', id).first();
    console.log('New productTypeId in DB:', product.productTypeId);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testUpdate();

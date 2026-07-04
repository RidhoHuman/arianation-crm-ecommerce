const knex = require('./src/config/knex');

async function debugUpdate() {
  try {
    const id = 'cmqqnj9ho00000svaeggscr56'; // The ID from the user's screenshot
    const updateData = {
      categoryId: "cmqpy0i7200000suq5674v041", // Replace with valid ID if needed
      productTypeId: "cmqptb0n600000stc0r37d7k6", // Replace with valid ID if needed
      updatedAt: new Date()
    };

    console.log('Trying to update product fields...');
    await knex('product').where('id', id).update(updateData);
    console.log('Update product table SUCCESS');

    // Test updating product_collection
    console.log('Trying to update product_collection...');
    await knex('product_collection').where('productId', id).del();
    console.log('Update product_collection SUCCESS');

  } catch (error) {
    console.error('❌ Error caught:', error);
  } finally {
    process.exit(0);
  }
}

debugUpdate();

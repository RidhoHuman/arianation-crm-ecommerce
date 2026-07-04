require('dotenv').config();
const productService = require('./src/services/productService');
const knex = require('./src/config/knex');

async function testCreate() {
  try {
    const product = await productService.create({
      categoryId: '1',
      productName: 'Test Product',
      description: 'Test description',
      price: 100000,
      stockQuantity: 10,
      productType: 'PHYSICAL',
      imageUrl: '/uploads/products/test.png',
      businessType: 'FASHION_RETAIL',
      tags: 'test',
      isSale: false,
      isActive: true,
      imageUrls: ['/uploads/products/test1.png', '/uploads/products/test2.png']
    });
    console.log('✅ Success:', product);
  } catch (error) {
    console.error('❌ Error creating product:');
    console.error(error.stack || error.message);
  } finally {
    await knex.destroy();
  }
}

testCreate();

require('dotenv').config();
const knex = require('./src/config/knex');

async function fixPlaceholders() {
  try {
    const products = await knex('product').where({ productType: 'CUSTOM_SABLON' });
    
    for (const product of products) {
      let bg = 'E5E7EB';
      let text = '374151';
      
      if (product.category === 'Tas & Merchandise') {
        bg = 'FEF3C7';
        text = '92400E';
      } else if (product.category === 'Packaging') {
        bg = 'FDE68A';
        text = 'B45309';
      }
      
      const newUrl = `https://placehold.co/600x400/${bg}/${text}?text=${encodeURIComponent(product.productName)}`;
      
      await knex('product')
        .where({ id: product.id })
        .update({ imageUrl: newUrl });
        
      console.log(`Updated ${product.productName} -> ${bg}/${text}`);
    }
    
    console.log('✅ Placeholder colors fixed.');
  } catch (error) {
    console.error('❌ Failed:', error);
  } finally {
    process.exit();
  }
}

fixPlaceholders();

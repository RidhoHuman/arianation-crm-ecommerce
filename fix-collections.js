require('dotenv').config();
const knex = require('./src/config/knex');

async function fixCollections() {
  try {
    console.log('🔄 Memasukkan produk ke dalam koleksi Best Seller & New Arrivals...');
    
    // Ambil beberapa ID produk secara acak/manual
    const newArrivals = ['prod-st-1', 'prod-adv-2', 'prod-ev-2'];
    const bestSellers = ['prod-wk-2', 'prod-adv-1', 'prod-ev-1', 'prod-st-2'];

    for (const prodId of newArrivals) {
      await knex.raw('INSERT IGNORE INTO product_collection (productId, collectionId) VALUES (?, ?)', [prodId, 'new-arrivals']);
    }

    for (const prodId of bestSellers) {
      await knex.raw('INSERT IGNORE INTO product_collection (productId, collectionId) VALUES (?, ?)', [prodId, 'best-seller']);
    }

    console.log('✅ Produk berhasil dimasukkan ke dalam koleksi.');
  } catch (error) {
    console.error('❌ Gagal memasukkan produk ke koleksi:', error);
  } finally {
    process.exit(0);
  }
}

fixCollections();

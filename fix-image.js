require('dotenv').config();
const knex = require('./src/config/knex');

async function fix() {
  try {
    await knex('product')
      .where({ productName: 'Chino Pants Slim Fit' })
      .update({ imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80' });
    console.log('✅ Gambar Chino Pants Slim Fit berhasil diperbarui.');
  } catch (error) {
    console.error('❌ Gagal memperbarui gambar:', error);
  } finally {
    process.exit();
  }
}

fix();

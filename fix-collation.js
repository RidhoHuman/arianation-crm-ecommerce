const knex = require('./src/config/knex');

async function autoFixCollation() {
  try {
    console.log('🔄 Memeriksa collation tabel user...');
    
    // Dapatkan collation dari tabel user
    const [rows] = await knex.raw(`
      SELECT TABLE_COLLATION 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'user'
    `);
    
    if (rows && rows.length > 0) {
      const userCollation = rows[0].TABLE_COLLATION;
      console.log(`✅ Collation tabel user ditemukan: ${userCollation}`);
      
      // Terapkan ke product_review
      console.log(`🔄 Menerapkan ${userCollation} ke tabel product_review...`);
      
      const charset = userCollation.split('_')[0]; // biasanya utf8mb4
      
      await knex.raw(`ALTER TABLE product_review CONVERT TO CHARACTER SET ${charset} COLLATE ${userCollation};`);
      
      console.log('🎉 BERHASIL! Tabel product_review sekarang sudah sinkron.');
    } else {
      console.log('❌ Tabel user tidak ditemukan!');
    }
  } catch (error) {
    console.error('❌ Gagal memperbaiki:', error.message);
  } finally {
    process.exit(0);
  }
}

autoFixCollation();

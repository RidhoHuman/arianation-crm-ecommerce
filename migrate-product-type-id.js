const knex = require('./src/config/knex');

async function migrate() {
  try {
    console.log('Menambahkan kolom productTypeId ke tabel product...');
    const hasColumn = await knex.schema.hasColumn('product', 'productTypeId');
    
    if (!hasColumn) {
      await knex.schema.alterTable('product', table => {
        // Asumsi ID dari product_type_master menggunakan tipe string (CUID/UUID) atau integer.
        // Jika id-nya string:
        table.string('productTypeId', 100).nullable();
      });
      console.log('✅ Kolom productTypeId berhasil ditambahkan!');
    } else {
      console.log('ℹ️ Kolom productTypeId sudah ada.');
    }
  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error.message);
  } finally {
    process.exit(0);
  }
}

migrate();

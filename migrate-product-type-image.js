const knex = require('./src/config/knex');

async function migrate() {
  try {
    console.log('Menambahkan kolom imageUrl ke tabel product_type_master...');
    const hasColumn = await knex.schema.hasColumn('product_type_master', 'imageUrl');
    
    if (!hasColumn) {
      await knex.schema.alterTable('product_type_master', table => {
        table.string('imageUrl', 500).nullable();
      });
      console.log('✅ Kolom imageUrl berhasil ditambahkan!');
    } else {
      console.log('ℹ️ Kolom imageUrl sudah ada.');
    }
  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error.message);
  } finally {
    process.exit(0);
  }
}

migrate();

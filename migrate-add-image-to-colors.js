const knex = require('./src/config/knex');

async function addImageUrl() {
  try {
    console.log('🔄 Memeriksa tabel product_color_variant...');

    const hasColumn = await knex.schema.hasColumn('product_color_variant', 'imageUrl');
    
    if (!hasColumn) {
      console.log('📝 Menambahkan kolom imageUrl ke tabel product_color_variant...');
      await knex.schema.alterTable('product_color_variant', (t) => {
        t.string('imageUrl', 255).nullable();
      });
      console.log('✅ Kolom imageUrl berhasil ditambahkan.');
    } else {
      console.log('✅ Kolom imageUrl sudah ada.');
    }

    console.log('🎉 Migrasi selesai!');
  } catch (error) {
    console.error('❌ Gagal melakukan migrasi:', error);
  } finally {
    await knex.destroy();
  }
}

addImageUrl();

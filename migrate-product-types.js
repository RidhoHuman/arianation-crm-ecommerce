const knex = require('./src/config/knex');

async function migrate() {
  try {
    console.log('🔄 Memeriksa tabel product_type_master...');
    const hasTable = await knex.schema.hasTable('product_type_master');
    
    if (!hasTable) {
      await knex.schema.createTable('product_type_master', (t) => {
        t.string('id').primary();
        t.string('typeName');
        t.string('slug').unique();
        t.boolean('isActive').defaultTo(true);
        t.timestamp('createdAt').defaultTo(knex.fn.now());
        t.timestamp('updatedAt').defaultTo(knex.fn.now());
      });
      console.log('✅ Tabel product_type_master berhasil dibuat!');

      // Insert default types for retail
      const cuid = require('cuid'); // use cuid if available, otherwise fallback
      const defaultTypes = [
        { id: cuid(), typeName: 'T-Shirts', slug: 't-shirts', isActive: true },
        { id: cuid(), typeName: 'Hoodies', slug: 'hoodies', isActive: true },
        { id: cuid(), typeName: 'Pants', slug: 'pants', isActive: true },
        { id: cuid(), typeName: 'Accessories', slug: 'accessories', isActive: true }
      ];

      await knex('product_type_master').insert(defaultTypes);
      console.log('✅ Data awal Tipe Produk berhasil dimasukkan!');
    } else {
      console.log('ℹ️ Tabel product_type_master sudah ada.');
    }

    console.log('🎉 Migrasi selesai!');
  } catch (error) {
    console.error('❌ Gagal menjalankan migrasi:', error);
  } finally {
    await knex.destroy();
  }
}

migrate();

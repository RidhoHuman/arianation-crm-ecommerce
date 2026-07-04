const knex = require('./src/config/knex');

async function migrateColors() {
  try {
    console.log('🔄 Memeriksa tabel product_color_variant...');

    const hasTable = await knex.schema.hasTable('product_color_variant');
    
    if (!hasTable) {
      console.log('📝 Membuat tabel product_color_variant...');
      await knex.schema.createTable('product_color_variant', (t) => {
        t.string('id').primary();
        t.string('productId', 191).notNullable().collate('utf8mb4_unicode_ci');
        t.string('colorName').notNullable();
        t.string('hexCode').nullable();
        t.integer('stockQuantity').defaultTo(0);
        t.timestamp('createdAt').defaultTo(knex.fn.now());
        t.timestamp('updatedAt').defaultTo(knex.fn.now());
        
        t.foreign('productId')
         .references('id')
         .inTable('product')
         .onDelete('CASCADE'); // Jika produk dihapus, warna juga terhapus
      });
      console.log('✅ Tabel product_color_variant berhasil dibuat.');
    } else {
      console.log('✅ Tabel product_color_variant sudah ada.');
    }

    // Mari kita seed beberapa data awal agar form DesignRequest.jsx tidak blank
    // Untuk polymailer, totebag, dll.
    console.log('🔄 Seeding warna default (jika belum ada) untuk mencegah blank UI...');
    
    // Ambil produk sablon template
    const products = await knex('product').where({ productType: 'SABLON_TEMPLATE' }).select('id', 'productName');
    
    let colorCount = 0;
    for (const p of products) {
      // Cek jika produk sudah punya variasi
      const existingVars = await knex('product_color_variant').where({ productId: p.id }).first();
      if (!existingVars) {
        const pName = p.productName.toLowerCase();
        let colorsToInsert = [];
        
        if (pName.includes('polymailer')) {
          colorsToInsert = [
            { id: `c-${p.id}-hitam`, productId: p.id, colorName: 'Hitam', hexCode: '#000000', stockQuantity: 100 },
            { id: `c-${p.id}-putih`, productId: p.id, colorName: 'Putih', hexCode: '#FFFFFF', stockQuantity: 100 }
          ];
        } else if (pName.includes('tote bag kanvas')) {
          colorsToInsert = [
            { id: `c-${p.id}-hitam`, productId: p.id, colorName: 'Hitam', hexCode: '#000000', stockQuantity: 50 },
            { id: `c-${p.id}-putih`, productId: p.id, colorName: 'Putih', hexCode: '#FFFFFF', stockQuantity: 50 },
            { id: `c-${p.id}-abumisty`, productId: p.id, colorName: 'Abu Misty', hexCode: '#d1d5db', stockQuantity: 50 }
          ];
        } else if (pName.includes('blacu')) {
          colorsToInsert = [
            { id: `c-${p.id}-krem`, productId: p.id, colorName: 'Natural/Krem', hexCode: '#FDFBF7', stockQuantity: 200 }
          ];
        } else if (pName.includes('paper bag') || pName.includes('box') || pName.includes('hampers')) {
          colorsToInsert = [
            { id: `c-${p.id}-coklat`, productId: p.id, colorName: 'Coklat Kraft', hexCode: '#D2B48C', stockQuantity: 500 }
          ];
        } else if (pName.includes('apron')) {
          colorsToInsert = [
            { id: `c-${p.id}-hitam`, productId: p.id, colorName: 'Hitam', hexCode: '#000000', stockQuantity: 20 },
            { id: `c-${p.id}-navy`, productId: p.id, colorName: 'Navy', hexCode: '#1e3a8a', stockQuantity: 20 },
            { id: `c-${p.id}-coklat`, productId: p.id, colorName: 'Coklat', hexCode: '#8B4513', stockQuantity: 20 }
          ];
        } else if (pName.includes('drawstring') || pName.includes('serut')) {
          colorsToInsert = [
            { id: `c-${p.id}-hitam`, productId: p.id, colorName: 'Hitam', hexCode: '#000000', stockQuantity: 30 }
          ];
        } else if (pName.includes('spunbond')) {
          colorsToInsert = [
            { id: `c-${p.id}-hitam`, productId: p.id, colorName: 'Hitam', hexCode: '#000000', stockQuantity: 100 },
            { id: `c-${p.id}-putih`, productId: p.id, colorName: 'Putih', hexCode: '#FFFFFF', stockQuantity: 100 }
          ];
        } else {
          // Default pakaian atau lainnya
          colorsToInsert = [
            { id: `c-${p.id}-hitam`, productId: p.id, colorName: 'Hitam', hexCode: '#000000', stockQuantity: 100 },
            { id: `c-${p.id}-putih`, productId: p.id, colorName: 'Putih', hexCode: '#FFFFFF', stockQuantity: 100 },
            { id: `c-${p.id}-navy`, productId: p.id, colorName: 'Navy', hexCode: '#1e3a8a', stockQuantity: 100 }
          ];
        }
        
        await knex('product_color_variant').insert(colorsToInsert);
        colorCount += colorsToInsert.length;
      }
    }
    
    if (colorCount > 0) {
      console.log(`✅ Berhasil menyisipkan ${colorCount} variasi warna awal untuk produk Sablon.`);
    } else {
      console.log('✅ Tidak ada variasi warna baru yang perlu disisipkan.');
    }

    console.log('🎉 Migrasi warna selesai!');
  } catch (error) {
    console.error('❌ Gagal melakukan migrasi:', error);
  } finally {
    await knex.destroy();
  }
}

migrateColors();

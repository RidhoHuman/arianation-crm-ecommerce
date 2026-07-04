const knex = require('./src/config/knex');

async function migrate() {
  try {
    console.log('🔄 Memeriksa dan memperbarui schema database...');

    // 1. Table Collection
    const hasCollection = await knex.schema.hasTable('collection');
    if (!hasCollection) {
      console.log('📝 Membuat tabel collection...');
      await knex.schema.createTable('collection', (t) => {
        t.string('id').primary();
        t.string('name');
        t.string('slug').unique();
        t.text('description').nullable();
        t.string('imageUrl').nullable();
        t.boolean('isActive').defaultTo(true);
        t.timestamp('createdAt').defaultTo(knex.fn.now());
        t.timestamp('updatedAt').defaultTo(knex.fn.now());
      });
    } else {
      console.log('✅ Tabel collection sudah ada.');
    }

    // 2. Table product_collection
    const hasProductCollection = await knex.schema.hasTable('product_collection');
    if (!hasProductCollection) {
      console.log('📝 Membuat tabel product_collection...');
      await knex.schema.createTable('product_collection', (t) => {
        t.string('productId');
        t.string('collectionId');
        t.primary(['productId', 'collectionId']);
      });
    } else {
      console.log('✅ Tabel product_collection sudah ada.');
    }

    // 3. Kolom tags & isSale di tabel product
    const hasProduct = await knex.schema.hasTable('product');
    if (hasProduct) {
      const hasTags = await knex.schema.hasColumn('product', 'tags');
      if (!hasTags) {
        console.log('📝 Menambahkan kolom tags dan isSale ke tabel product...');
        await knex.schema.alterTable('product', t => {
          t.string('tags').nullable();
          t.boolean('isSale').defaultTo(false);
        });
      } else {
        console.log('✅ Kolom tags dan isSale sudah ada di tabel product.');
      }
    }


    // 4. Table store_settings
    const hasStoreSettings = await knex.schema.hasTable('store_settings');
    if (!hasStoreSettings) {
      console.log('📝 Membuat tabel store_settings...');
      await knex.schema.createTable('store_settings', (t) => {
        t.string('settingKey').primary();
        t.text('settingValue');
        t.timestamp('updatedAt').defaultTo(knex.fn.now());
      });
      // Insert default values
      await knex('store_settings').insert([
        { settingKey: 'best_seller_threshold', settingValue: '5' }
      ]);
    } else {
      console.log('✅ Tabel store_settings sudah ada.');
    }

    // 5. Table print_techniques
    const hasPrintTechniques = await knex.schema.hasTable('print_techniques');
    if (!hasPrintTechniques) {
      console.log('📝 Membuat tabel print_techniques...');
      await knex.schema.createTable('print_techniques', (t) => {
        t.string('id').primary();
        t.string('name').notNullable();
        t.text('description').nullable();
        t.text('allowedCategories').nullable(); // JSON array
        t.integer('minOrder').defaultTo(1);
        t.string('pricingType').defaultTo('fixed');
        t.integer('basePrice').defaultTo(0);
        t.integer('maxColors').nullable();
        t.string('imageUrl').nullable();
        t.boolean('isActive').defaultTo(true);
        t.timestamp('createdAt').defaultTo(knex.fn.now());
        t.timestamp('updatedAt').defaultTo(knex.fn.now());
      });
    } else {
      console.log('✅ Tabel print_techniques sudah ada.');
    }

    console.log('✅ Semua perbaikan database berhasil!');
  } catch (error) {
    console.error('❌ Gagal melakukan migrasi:', error);
  } finally {
    await knex.destroy();
  }
}

migrate();

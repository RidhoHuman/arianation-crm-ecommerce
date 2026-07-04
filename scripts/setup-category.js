require('dotenv').config();
const knex = require('../src/config/knex');

async function createCategoryTable() {
  try {
    const exists = await knex.schema.hasTable('category');
    if (!exists) {
      await knex.schema.createTable('category', (table) => {
        table.string('id').primary(); // manual cuid
        table.string('name').notNullable();
        table.string('slug').unique().notNullable();
        table.text('description').nullable();
        table.string('imageUrl').nullable();
        table.boolean('isActive').defaultTo(true);
        table.datetime('createdAt').defaultTo(knex.fn.now());
        table.datetime('updatedAt').defaultTo(knex.fn.now());
      });
      console.log('✅ Tabel category berhasil dibuat.');

      // Insert default categories
      const cuid = require('cuid');
      await knex('category').insert([
        {
          id: cuid(),
          name: 'Supporter Culture',
          slug: 'supporter-culture',
          description: 'Koleksi untuk suporter bola',
          isActive: true
        },
        {
          id: cuid(),
          name: 'T-Shirts',
          slug: 't-shirts',
          description: 'Kaos harian',
          isActive: true
        },
        {
          id: cuid(),
          name: 'Accessories',
          slug: 'accessories',
          description: 'Aksesoris, topi, tas',
          isActive: true
        }
      ]);
      console.log('✅ Default categories inserted.');

    } else {
      console.log('⚠️ Tabel category sudah ada.');
    }
  } catch (error) {
    console.error('❌ Error creating category table:', error);
  } finally {
    process.exit(0);
  }
}

createCategoryTable();

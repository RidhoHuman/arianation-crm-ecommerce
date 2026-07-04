require('dotenv').config();
const knex = require('./src/config/knex');

async function migratePortfolio() {
  try {
    const hasTable = await knex.schema.hasTable('sablon_portfolio');
    if (!hasTable) {
      await knex.schema.createTable('sablon_portfolio', (table) => {
        table.increments('id').primary();
        table.string('title').notNullable();
        table.string('category').notNullable();
        table.string('imageUrl').notNullable();
        table.integer('sortOrder').defaultTo(0);
        table.boolean('isActive').defaultTo(true);
        table.timestamps(true, true); // createdAt, updatedAt
      });
      console.log('✅ Tabel sablon_portfolio berhasil dibuat');
    } else {
      console.log('ℹ️ Tabel sablon_portfolio sudah ada');
      
      const hasSortOrder = await knex.schema.hasColumn('sablon_portfolio', 'sortOrder');
      if (!hasSortOrder) {
        await knex.schema.alterTable('sablon_portfolio', table => {
          table.integer('sortOrder').defaultTo(0);
        });
        console.log('✅ Kolom sortOrder ditambahkan ke sablon_portfolio');
      }
    }

    // Insert seeder data jika kosong
    const count = await knex('sablon_portfolio').count('id as count').first();
    if (count.count === 0) {
      const seedData = [
        { title: 'Sablon DTF - Event Kampus', category: 'Pakaian', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop', sortOrder: 1 },
        { title: 'Seragam Barista - Apron Canvas', category: 'Tas & Merchandise', imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800&auto=format&fit=crop', sortOrder: 2 },
        { title: 'Paper Bag Custom - Brand Hijab', category: 'Packaging', imageUrl: 'https://images.unsplash.com/photo-1587522501438-e6d8a436940a?q=80&w=800&auto=format&fit=crop', sortOrder: 3 },
        { title: 'Tote Bag Kanvas - Seminar', category: 'Tas & Merchandise', imageUrl: 'https://images.unsplash.com/photo-1597484661643-2f5fef640df1?q=80&w=800&auto=format&fit=crop', sortOrder: 4 },
        { title: 'Hoodie Komunitas - Sablon Plastisol', category: 'Pakaian', imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop', sortOrder: 5 },
        { title: 'Polymailer Olshop - Sablon 1 Warna', category: 'Packaging', imageUrl: 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?q=80&w=800&auto=format&fit=crop', sortOrder: 6 }
      ];
      await knex('sablon_portfolio').insert(seedData);
      console.log('✅ Seeder sablon_portfolio berhasil dimasukkan');
    }

    console.log('Selesai!');
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat migrasi:', error);
  } finally {
    process.exit(0);
  }
}

migratePortfolio();

require('dotenv').config();
const knex = require('./src/config/knex');

async function migrate() {
  try {
    const hasColumn = await knex.schema.hasColumn('print_techniques', 'priceMatrix');
    if (!hasColumn) {
      await knex.schema.alterTable('print_techniques', table => {
        table.json('priceMatrix').nullable();
      });
      console.log('✅ Added priceMatrix column to print_techniques');
    } else {
      console.log('ℹ️ priceMatrix column already exists');
    }

    // Seed DTF prices
    const dtf = await knex('print_techniques').where('name', 'DTF (Full Color)').first();
    if (dtf) {
      const priceMatrix = {
        "Logo/Kecil (Maks 10x10cm)": 10000,
        "A4 / Sedang (Maks 21x30cm)": 25000,
        "A3 / Besar (Maks 30x42cm)": 40000
      };
      await knex('print_techniques')
        .where('id', dtf.id)
        .update({
          priceMatrix: JSON.stringify(priceMatrix)
        });
      console.log('✅ Seeded priceMatrix for DTF (Full Color)');
    } else {
      console.log('⚠️ DTF (Full Color) technique not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

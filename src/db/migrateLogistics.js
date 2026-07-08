const knex = require('../config/knex');

async function migrate() {
  try {
    console.log('Migrating product table...');
    const hasWeight = await knex.schema.hasColumn('product', 'weight');
    if (!hasWeight) {
      await knex.schema.alterTable('product', (table) => {
        table.integer('weight').defaultTo(250).comment('Weight in grams');
      });
      console.log('Added weight to product table.');
    } else {
      console.log('Product table already has weight column.');
    }

    console.log('Migrating order table...');
    const hasShippingCourier = await knex.schema.hasColumn('order', 'shippingCourier');
    if (!hasShippingCourier) {
      await knex.schema.alterTable('order', (table) => {
        table.string('shippingCourier').nullable();
        table.integer('shippingCost').nullable();
        table.string('trackingNumber').nullable();
        table.string('biteshipOrderId').nullable();
        table.integer('actualWeight').nullable().comment('Actual weight for custom sablon');
      });
      console.log('Added logistics columns to order table.');
    } else {
      console.log('Order table already has logistics columns.');
    }

    console.log('Creating couriers table...');
    const hasCouriersTable = await knex.schema.hasTable('couriers');
    if (!hasCouriersTable) {
      await knex.schema.createTable('couriers', (table) => {
        table.string('id').primary();
        table.string('code').notNullable().unique();
        table.string('name').notNullable();
        table.boolean('isActive').defaultTo(true);
      });
      console.log('Couriers table created.');

      console.log('Seeding couriers...');
      await knex('couriers').insert([
        { id: require('cuid')(), code: 'jnt', name: 'J&T Express', isActive: true },
        { id: require('cuid')(), code: 'sicepat', name: 'SiCepat Ekspres', isActive: true },
        { id: require('cuid')(), code: 'jne', name: 'JNE', isActive: true }
      ]);
      console.log('Couriers seeded.');
    } else {
      console.log('Couriers table already exists.');
    }

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();

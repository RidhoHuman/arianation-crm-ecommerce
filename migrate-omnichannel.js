const knex = require('./src/config/knex');

async function migrate() {
  try {
    console.log('Migrating order table for Omnichannel...');
    const hasDeliveryType = await knex.schema.hasColumn('order', 'deliveryType');
    if (!hasDeliveryType) {
      await knex.schema.alterTable('order', (table) => {
        table.string('deliveryType').defaultTo('SHIPPING');
      });
      console.log('Added deliveryType to order table.');
    } else {
      console.log('Order table already has deliveryType column.');
    }

    console.log('Migrating store_settings...');
    const hasSettingsTable = await knex.schema.hasTable('store_settings');
    if (hasSettingsTable) {
      const existingSetting = await knex('store_settings').where('settingKey', 'pickup_instructions').first();
      if (!existingSetting) {
        await knex('store_settings').insert({
          settingKey: 'pickup_instructions',
          settingValue: 'Barang dapat diambil di Gudang Arianation (Jl. Kali Urang, No 19 Malang). Jam Operasional: Senin-Jumat (09.00 - 17.00). Harap bawa Nomor Pesanan Anda sebagai bukti pengambilan.'
        });
        console.log('Inserted default pickup_instructions.');
      } else {
        console.log('pickup_instructions already exists.');
      }
    } else {
      console.log('store_settings table does not exist.');
    }

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();

require('dotenv').config();
const knex = require('../src/config/knex');

async function migrateOrderHybrid() {
  console.log('🚀 Memulai migrasi skema tabel Order untuk Sistem Hibrid (Sprint 1)...');

  try {
    const hasTable = await knex.schema.hasTable('order');
    if (!hasTable) {
      throw new Error('Tabel order tidak ditemukan!');
    }

    const columnsToAdd = {
      'totalItemPrice': { type: 'integer', default: 0 },
      'paymentOption': { type: 'enum', values: ['LUNAS', 'DP_50'], nullable: true },
      'productPaymentStatus': { type: 'enum', values: ['PENDING', 'HALF_PAID', 'FULLY_PAID'], default: 'PENDING' },
      'shippingPaymentStatus': { type: 'enum', values: ['PENDING', 'PAID'], default: 'PENDING' },
      'productionStatus': { type: 'enum', values: ['CART', 'QUEUE', 'ON_PROCESS', 'DONE'], default: 'CART' },
      'shippingStatus': { type: 'enum', values: ['UNSHIPPED', 'SHIPPED', 'DELIVERED'], default: 'UNSHIPPED' },
    };

    console.log('🔍 Memeriksa dan menambahkan kolom baru...');
    await knex.schema.alterTable('order', (t) => {
      // Loop over columns to check if they exist manually inside the block? No, knex schema alter doesn't allow async checking inside.
      // So we will do it sequentially outside.
    });

    for (const [colName, colDef] of Object.entries(columnsToAdd)) {
      const exists = await knex.schema.hasColumn('order', colName);
      if (!exists) {
        await knex.schema.alterTable('order', (t) => {
          if (colDef.type === 'integer') {
            t.integer(colName).defaultTo(colDef.default);
          } else if (colDef.type === 'enum') {
            let col = t.enu(colName, colDef.values);
            if (colDef.default) {
              col.defaultTo(colDef.default);
            }
            if (colDef.nullable) {
              col.nullable();
            }
          }
        });
        console.log(`✅ Kolom '${colName}' ditambahkan.`);
      } else {
        console.log(`ℹ️ Kolom '${colName}' sudah ada, melewatinya.`);
      }
    }
    
    // Also change totalAmount to grandTotal? The user said "grand_total: INT (total_item_price + total_shipping_cost)". 
    // Wait, totalAmount is already there. Let's just keep totalAmount as it is, or alias it in code. The user says "grand_total", maybe we should add it? 
    // Or we just add grandTotal column?
    const hasGrandTotal = await knex.schema.hasColumn('order', 'grandTotal');
    if (!hasGrandTotal) {
      await knex.schema.alterTable('order', (t) => t.integer('grandTotal').defaultTo(0));
      console.log(`✅ Kolom 'grandTotal' ditambahkan.`);
    }

    console.log('\n🔧 Mapping Legacy Orders (Pesanan Lama)...');
    
    // Update old completed orders
    const updateResult = await knex('order')
      .whereIn('status', ['DELIVERED', 'COMPLETED', 'SHIPPED', 'CONFIRMED'])
      .whereNull('paymentOption') // hanya yang belum ter-migrate
      .update({
        productPaymentStatus: 'FULLY_PAID',
        shippingStatus: 'DELIVERED',
        shippingPaymentStatus: 'PAID',
        paymentOption: 'LUNAS',
        productionStatus: 'DONE'
      });
      
    console.log(`✅ Berhasil mapping ${updateResult} pesanan lama.`);

    console.log('\n🎉 Migrasi selesai!');
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat migrasi:', error);
  } finally {
    process.exit(0);
  }
}

migrateOrderHybrid();

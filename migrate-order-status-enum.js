const knex = require('./src/config/knex');

async function migrate() {
  try {
    console.log('🔄 Memperbarui enum status di tabel order...');
    await knex.raw("ALTER TABLE `order` MODIFY COLUMN status enum('PENDING','CONFIRMED','PAID_WAITING_APPROVAL','IN_PRODUCTION','WAITING_FINAL_PAYMENT','PROCESSING','READY_TO_SHIP','READY_FOR_DELIVERY','SHIPPED','DELIVERED','CANCELLED','ABANDONED','FAILED','ON_HOLD','REFUND_REQUESTED','REFUNDED','RETURNED') NOT NULL DEFAULT 'PENDING'");
    console.log('✅ Enum status di tabel order berhasil diperbarui!');
  } catch (err) {
    console.error('❌ Gagal:', err);
  } finally {
    await knex.destroy();
  }
}

migrate();

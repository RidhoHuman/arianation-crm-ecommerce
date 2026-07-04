require('dotenv').config();
const knex = require('../src/config/knex');

async function alterDesignRequestTable() {
  try {
    console.log('🔄 Menambahkan kolom baru ke tabel designRequest...');

    const hasPurpose = await knex.schema.hasColumn('designRequest', 'purpose');
    if (!hasPurpose) {
      await knex.schema.alterTable('designRequest', (t) => {
        t.string('purpose').nullable();
        t.text('sizeBreakdown').nullable();
        t.string('printPosition').nullable();
        t.string('printTechnique').nullable();
        t.integer('numberOfColors').nullable();
        t.string('picName').nullable();
        t.string('whatsappNumber').nullable();
        t.text('shippingAddress').nullable();
        t.text('shippingNotes').nullable();
      });
      console.log('✅ Berhasil menambahkan kolom baru ke designRequest');
    } else {
      console.log('⏭️  Kolom sudah ada, melewati...');
    }

  } catch (error) {
    console.error('❌ Gagal mengubah tabel:', error);
  } finally {
    await knex.destroy();
  }
}

alterDesignRequestTable();

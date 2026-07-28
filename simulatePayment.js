const axios = require('axios');
const knex = require('./src/config/knex');
require('dotenv').config();

async function simulate() {
  const orderId = process.argv[2];
  if (!orderId) {
    console.error('Harap masukkan orderId. Contoh: node simulatePayment.js cmrknvy2i0003ggva8jjm5tfa');
    process.exit(1);
  }

  const payment = await knex('payment').where('orderId', orderId).orderBy('createdAt', 'desc').first();
  if (!payment) {
    console.error('Payment tidak ditemukan untuk order: ' + orderId);
    process.exit(1);
  }

  const payload = {
    id: 'simulated_xendit_id_' + Date.now(),
    external_id: payment.id,
    status: 'PAID',
    amount: payment.amount,
    payment_method: 'CREDIT_CARD',
    updated_at: new Date().toISOString()
  };

  console.log(`Mengirim webhook sukses ke http://localhost:3001/api/webhooks/xendit untuk payment ID: ${payment.id}...`);

  try {
    const res = await axios.post('http://localhost:3001/api/webhooks/xendit', payload, {
      headers: {
        'x-callback-token': process.env.XENDIT_WEBHOOK_VERIFY_TOKEN
      }
    });
    console.log('✅ Simulasi Pembayaran Berhasil! Status pesanan sudah berubah ke PAID_WAITING_APPROVAL.');
  } catch (err) {
    console.error('❌ Gagal simulasi webhook:', err.response ? err.response.data : err.message);
  }
  process.exit(0);
}

simulate();

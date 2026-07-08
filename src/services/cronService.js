const cron = require('node-cron');
const knex = require('../config/knex');
const orderFulfillmentService = require('./orderFulfillmentService');

/**
 * Check for SLA Abandonment
 * Orders that have been in WAITING_FINAL_PAYMENT for > 7 days will be ABANDONED.
 */
const checkSLAAbandonment = async () => {
  try {
    const pendingOrders = await knex('order')
      .select('id', 'userId', 'status')
      .where('status', 'WAITING_FINAL_PAYMENT');

    if (pendingOrders.length === 0) return;

    const now = new Date();
    // 7 days in milliseconds
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    for (const order of pendingOrders) {
      // Find the exact timestamp when this order entered WAITING_FINAL_PAYMENT
      // This avoids the 'updatedAt Trap'
      const historyRecord = await knex('orderStatusHistory')
        .select('createdAt')
        .where({ orderId: order.id, newStatus: 'WAITING_FINAL_PAYMENT' })
        .orderBy('createdAt', 'asc')
        .first();

      if (!historyRecord) continue;

      const timeSinceRequested = now.getTime() - new Date(historyRecord.createdAt).getTime();

      if (timeSinceRequested > sevenDaysInMs) {
        try {
          // Double check the status and lock transactionally inside updateOrderStatus
          // updateOrderStatus is now protected against Race Conditions
          await orderFulfillmentService.updateOrderStatus(
            order.id,
            'ABANDONED',
            'SYSTEM',
            'SLA Abandonment: Pembatalan otomatis karena melewati 7 hari.',
            'Sistem otomatis membatalkan pesanan karena tidak ada pelunasan dalam 7 hari sejak DP dibayarkan. DP hangus.'
          );
          
          console.log(`[Cron] Order ${order.id} automatically abandoned due to 7 days SLA.`);
        } catch (updateErr) {
          // It might be a race condition (updatedRows === 0), which is handled safely
          if (updateErr.message && updateErr.message.includes('Race condition')) {
            console.log(`[Cron] Race condition prevented for order ${order.id}. Status was already changed.`);
          } else {
            console.error(`[Cron] Failed to abandon order ${order.id}:`, updateErr);
          }
        }
      }
    }
  } catch (err) {
    console.error('[Cron] Error in SLA Abandonment check:', err);
  }
};

const initCronJobs = () => {
  console.log('[Cron] Initializing Scheduled Jobs...');
  
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running hourly SLA Abandonment check...');
    await checkSLAAbandonment();
  });

  // You can add more cron jobs here in the future
};

module.exports = {
  initCronJobs,
  checkSLAAbandonment // Exported for testing purposes
};

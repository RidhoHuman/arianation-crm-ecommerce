const cron = require('node-cron');
const knex = require('../config/knex');
const orderFulfillmentService = require('./orderFulfillmentService');
const notificationService = require('./notificationService');

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
            console.log(
              `[Cron] Race condition prevented for order ${order.id}. Status was already changed.`
            );
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

/**
 * Check for Design Request Reminders (Semi-Auto)
 * Remind customers if their design is APPROVED but not checked out > 7 days.
 */
const processDesignRequestReminders = async () => {
  try {
    const pendingRequests = await knex('designRequest')
      .select(
        'id',
        'userId',
        'designTitle',
        'estimatedPrice',
        'reminderCount',
        'lastRemindedAt',
        'updatedAt'
      )
      .where('status', 'APPROVED');

    if (pendingRequests.length === 0) return;

    const now = new Date();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    for (const req of pendingRequests) {
      const baseDate = req.lastRemindedAt ? new Date(req.lastRemindedAt) : new Date(req.updatedAt);
      const timeSinceAction = now.getTime() - baseDate.getTime();

      if (timeSinceAction > sevenDaysInMs) {
        try {
          // Send notification via notification service
          await notificationService.queueCustomerNotification({
            referenceId: req.id,
            referenceType: 'DESIGN_REQUEST',
            userId: req.userId,
            type: 'DESIGN_REQUEST_REMINDER',
            title: 'Pengingat Penawaran Custom Sablon 🕒',
            message: `Halo! Penawaran harga untuk desain "${req.designTitle}" (Rp ${Number(req.estimatedPrice).toLocaleString('id-ID')}) masih menunggu. Apakah ada kendala atau ingin melanjutkan?`,
          });

          // Update tracking columns
          await knex('designRequest')
            .where('id', req.id)
            .update({
              reminderCount: req.reminderCount + 1,
              lastRemindedAt: now,
              updatedAt: now, // since we're modifying the row
            });

          console.log(
            `[Cron] Sent reminder #${req.reminderCount + 1} for Design Request ${req.id}`
          );
        } catch (updateErr) {
          console.error(
            `[Cron] Failed to process reminder for Design Request ${req.id}:`,
            updateErr
          );
        }
      }
    }
  } catch (err) {
    console.error('[Cron] Error in Design Request Reminder check:', err);
  }
};

const initCronJobs = () => {
  console.log('[Cron] Initializing Scheduled Jobs...');

  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running hourly checks...');
    await checkSLAAbandonment();
    await processDesignRequestReminders();
  });

  // You can add more cron jobs here in the future
};

module.exports = {
  initCronJobs,
  checkSLAAbandonment,
  processDesignRequestReminders, // Exported for testing purposes
};

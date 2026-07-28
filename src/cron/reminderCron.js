const cron = require('node-cron');
const knex = require('../config/knex');
const notificationService = require('../services/notificationService');
const cuid = require('cuid');

const startReminderCron = () => {
  // Run every day at 00:00
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running daily SLA and Reminder checks...');
    try {
      await checkDesignRequestDPReminders();
      await checkPelunasanSLA();
    } catch (err) {
      console.error('[CRON] Error running jobs:', err);
    }
  });
};

const checkDesignRequestDPReminders = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Find design requests that were APPROVED more than 7 days ago and still pending payment (not converted to order, or order not paid)
  // Since we don't have a direct "payment status" on designRequest, we check if it is still APPROVED
  // Note: when checkout DP/Full is completed, status remains APPROVED until admin finishes or it might stay APPROVED?
  // Actually, wait, if order is created, the designRequest might stay APPROVED but order is created.
  // We should check if an order exists for this design request that is PAID. But `orderId` is in designRequest.

  const requests = await knex('designRequest')
    .where('status', 'APPROVED')
    .where('updatedAt', '<', sevenDaysAgo);

  for (const req of requests) {
    // Check if an order is already paid for this design request
    let hasPaidOrder = false;
    if (req.orderId) {
      const order = await knex('order').where('id', req.orderId).first();
      if (order && !['PENDING', 'FAILED', 'CANCELLED', 'ABANDONED'].includes(order.status)) {
        hasPaidOrder = true;
      }
    }

    if (!hasPaidOrder) {
      // Send reminder
      console.log(`[CRON] Sending DP reminder for DesignRequest ID: ${req.id}`);
      await notificationService.queueCustomerNotification({
        referenceId: req.id,
        referenceType: 'DESIGN_REQUEST',
        userId: req.userId,
        type: 'SYSTEM',
        title: 'Pengingat Pembayaran Custom Sablon',
        message: `Pesanan sablon "${req.designTitle}" Anda telah disetujui lebih dari 7 hari. Silakan lanjutkan pembayaran DP atau Pelunasan agar pesanan dapat segera diproses.`,
      });
    }
  }
};

const checkPelunasanSLA = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // SLA Pelunasan: order is READY_FOR_DELIVERY, 30 days passed, and it's a SAB order
  const orders = await knex('order')
    .where('status', 'READY_FOR_DELIVERY')
    .where('orderNumber', 'like', 'SAB-%')
    .where('updatedAt', '<', thirtyDaysAgo);

  for (const order of orders) {
    // Check if it really used DP.
    const dpPayment = await knex('payment')
      .where('orderId', order.id)
      .where('paymentType', 'DP_50')
      .first();

    if (dpPayment) {
      // It's a DP order. Let's see if they have paid Pelunasan
      const pelunasanPayment = await knex('payment')
        .where('orderId', order.id)
        .where('paymentType', 'PELUNASAN')
        .where('status', 'PAID')
        .first();

      if (!pelunasanPayment) {
        // Freeze order (ON_HOLD)
        console.log(`[CRON] Setting order ${order.orderNumber} to ON_HOLD due to SLA pelunasan.`);

        await knex.transaction(async (trx) => {
          await trx('order').where('id', order.id).update({
            status: 'ON_HOLD',
            updatedAt: new Date(),
          });

          await trx('orderStatusHistory').insert({
            id: cuid(),
            orderId: order.id,
            previousStatus: 'READY_FOR_DELIVERY',
            newStatus: 'ON_HOLD',
            reason: 'Melewati SLA pelunasan 30 hari',
            updatedBy: 'SYSTEM',
            createdAt: new Date(),
          });
        });

        // Notify user
        await notificationService.queueCustomerNotification({
          referenceId: order.id,
          referenceType: 'ORDER',
          userId: order.userId,
          type: 'SYSTEM',
          title: 'Pesanan Dibekukan (ON HOLD)',
          message: `Pesanan ${order.orderNumber} telah dibekukan karena melewati batas waktu pelunasan 30 hari.`,
        });
      }
    }
  }
};

module.exports = { startReminderCron };

const orderFulfillmentService = require('../services/orderFulfillmentService');
const paymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');
const knex = require('../config/knex');
const { coreApi } = require('../config/midtrans');

const handleXenditWebhook = async (req, res, next) => {
  try {
    // Verifikasi Token Webhook Xendit
    const webhookToken = req.headers['x-callback-token'];
    if (webhookToken !== process.env.XENDIT_WEBHOOK_VERIFY_TOKEN) {
      return res.status(403).json({ success: false, message: 'Invalid webhook token' });
    }

    const { id, external_id, status, amount, payment_method, updated_at } = req.body;

    if (!external_id) {
      return res.status(400).json({ success: false, message: 'Missing external_id' });
    }

    // external_id from Xendit is now our payment.id
    const paymentId = external_id;

    if (status === 'PAID' || status === 'SETTLED') {
      // Find payment by payment.id (external_id)
      const existingPayment = await paymentService.findById(paymentId) || await knex('payment').where('id', paymentId).first();
      
      if (!existingPayment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }
      
      const orderId = existingPayment.orderId;

      if (existingPayment.status !== 'COMPLETED') {
        const order = await knex('order').where('id', orderId).first();
        if (!order) {
           return res.status(404).json({ success: false, message: 'Order not found' });
        }

        let newOrderStatus = 'PAID_WAITING_APPROVAL'; // Default for Retail & Sablon DP
        if (order.status === 'WAITING_FINAL_PAYMENT' || order.status === 'ON_HOLD') {
          newOrderStatus = 'READY_TO_SHIP'; // Sablon Pelunasan
        }

        // 1. Simpan atau update record pembayaran DULU agar validasi State Machine lolos
        await paymentService.updateStatus(existingPayment.id, 'COMPLETED', id);

        // 2. Update status pesanan menggunakan fulfillment service
        // Transaction is handled inside orderFulfillmentService
        await orderFulfillmentService.updateOrderStatus(
          orderId,
          newOrderStatus,
          'SYSTEM',
          'Payment successful via Xendit',
          `Xendit Invoice ID: ${id}, Method: ${payment_method}`
        );

        // 3. Trigger Notification immediately
        try {
          const notif = await notificationService.queueNotification({
            orderId,
            userId: order.userId || null,
            type: newOrderStatus,
            title: 'Pembayaran Berhasil 💸',
            message: 'Terima kasih, pembayaran Anda telah kami terima dan pesanan Anda sedang kami proses.',
          });
          await notificationService.sendOrderNotification(notif.id);
        } catch (err) {
          console.error('[Xendit Webhook] Error sending notification:', err.message);
        }
      } else {
        console.log(`[Xendit Webhook] Payment ${paymentId} is already PAID. Skipping duplicate processing.`);
      }
    } else if (status === 'EXPIRED') {
      const existingPayment = await knex('payment').where('id', paymentId).first();
      if (existingPayment && existingPayment.status !== 'FAILED' && existingPayment.status !== 'COMPLETED') {
        await orderFulfillmentService.updateOrderStatus(
          existingPayment.orderId,
          'CANCELLED',
          'SYSTEM',
          'Payment expired',
          `Xendit Invoice ID: ${id}`
        );
        await paymentService.updateStatus(existingPayment.id, 'FAILED');
      }
    }

    // Selalu balas 200 OK ke Xendit agar tidak di-retry terus-menerus
    return res.status(200).json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Error handling Xendit webhook:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const handleMidtransWebhook = async (req, res, next) => {
  try {
    const notificationJson = req.body;
    const statusResponse = await coreApi.transaction.notification(notificationJson);
    
    const transactionId = statusResponse.order_id; // transactionId is used as order_id in snap parameter
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`[Midtrans Webhook] Transaction ${transactionId} status: ${transactionStatus}`);

    // Find the payment
    const payment = await knex('payment').where('transactionId', transactionId).first();
    
    if (!payment) {
      console.warn(`[Midtrans Webhook] Payment not found for transaction: ${transactionId}`);
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    let paymentStatus = payment.status;

    if (transactionStatus == 'capture') {
      if (fraudStatus == 'challenge') {
        paymentStatus = 'PENDING'; 
      } else if (fraudStatus == 'accept') {
        paymentStatus = 'COMPLETED';
      }
    } else if (transactionStatus == 'settlement') {
      paymentStatus = 'COMPLETED';
    } else if (
      transactionStatus == 'cancel' ||
      transactionStatus == 'deny' ||
      transactionStatus == 'expire'
    ) {
      paymentStatus = 'FAILED';
    } else if (transactionStatus == 'pending') {
      paymentStatus = 'PENDING';
    }

    // Update payment status
    if (paymentStatus !== payment.status) {
      if (paymentStatus === 'COMPLETED' && payment.status === 'COMPLETED') {
         // Prevent duplicate
         console.log(`[Midtrans Webhook] Transaction ${transactionId} already COMPLETED. Idempotency check passed.`);
         return res.status(200).json({ success: true, message: 'Webhook received' });
      }

      const order = await knex('order').where('id', payment.orderId).first();
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      await paymentService.updateStatus(payment.id, paymentStatus);
      
      // Update order status based on payment
      if (paymentStatus === 'COMPLETED') {
        let newOrderStatus = 'PAID_WAITING_APPROVAL';
        if (order.status === 'WAITING_FINAL_PAYMENT') {
          newOrderStatus = 'READY_TO_SHIP';
        }

        await orderFulfillmentService.updateOrderStatus(
          payment.orderId,
          newOrderStatus,
          'SYSTEM',
          'Payment successful via Midtrans',
          `Midtrans Transaction ID: ${statusResponse.transaction_id}`
        );
        
        // Trigger Notification
        try {
          const notif = await notificationService.queueNotification({
            orderId: payment.orderId,
            userId: order.userId || null,
            type: newOrderStatus,
            title: 'Pembayaran Berhasil 💸',
            message: 'Terima kasih, pembayaran Anda telah kami terima dan pesanan Anda sedang kami proses.',
          });
          await notificationService.sendOrderNotification(notif.id);
        } catch (err) {
          console.error('[Midtrans Webhook] Error sending notification:', err.message);
        }
      } else if (paymentStatus === 'FAILED' && order.status !== 'CANCELLED') {
        await orderFulfillmentService.updateOrderStatus(
          payment.orderId,
          'CANCELLED',
          'SYSTEM',
          'Payment failed/expired via Midtrans',
          `Midtrans Transaction ID: ${statusResponse.transaction_id}`
        );
      }
    } else {
      console.log(`[Midtrans Webhook] Transaction ${transactionId} status unchanged (${payment.status}). Idempotency check passed.`);
    }

    return res.status(200).json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('[Midtrans Webhook] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  handleXenditWebhook,
  handleMidtransWebhook
};

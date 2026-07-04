const orderFulfillmentService = require('../services/orderFulfillmentService');
const paymentService = require('../services/paymentService');
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

    // external_id adalah orderId dari sistem kita
    const orderId = external_id;

    if (status === 'PAID' || status === 'SETTLED') {
      // 1. Update status pesanan menggunakan fulfillment service
      await orderFulfillmentService.updateOrderStatus(
        orderId,
        'CONFIRMED',
        'SYSTEM',
        'Payment successful via Xendit',
        `Xendit Invoice ID: ${id}, Method: ${payment_method}`
      );

      // 2. Simpan atau update record pembayaran
      const existingPayment = await paymentService.findByOrderId(orderId);
      if (existingPayment) {
        await paymentService.updateStatus(existingPayment.id, 'COMPLETED', id);
      } else {
        await paymentService.create({
          orderId,
          paymentMethod: payment_method || 'XENDIT',
          amount,
          status: 'COMPLETED',
          transactionId: id
        });
      }
    } else if (status === 'EXPIRED') {
      await orderFulfillmentService.updateOrderStatus(
        orderId,
        'CANCELLED',
        'SYSTEM',
        'Payment expired',
        `Xendit Invoice ID: ${id}`
      );
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
      await paymentService.updateStatus(payment.id, paymentStatus);
      
      // Update order status based on payment
      if (paymentStatus === 'COMPLETED') {
        await orderFulfillmentService.updateOrderStatus(
          payment.orderId,
          'CONFIRMED',
          'SYSTEM',
          'Payment successful via Midtrans',
          `Midtrans Transaction ID: ${statusResponse.transaction_id}`
        );
      } else if (paymentStatus === 'FAILED') {
        await orderFulfillmentService.updateOrderStatus(
          payment.orderId,
          'CANCELLED',
          'SYSTEM',
          'Payment failed/expired via Midtrans',
          `Midtrans Transaction ID: ${statusResponse.transaction_id}`
        );
      }
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

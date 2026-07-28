// src/services/orderFulfillmentService.js

const knex = require('../config/knex');
const { BadRequestError } = require('../utils/errors');
const notificationService = require('./notificationService');

const validTransitions = {
  PENDING: [
    'PAID_WAITING_APPROVAL',
    'CONFIRMED',
    'CANCELLED',
    'READY_TO_SHIP',
    'PROCESSING',
    'ON_HOLD',
    'IN_PRODUCTION',
  ],
  CONFIRMED: ['PROCESSING', 'CANCELLED', 'REFUND_REQUESTED', 'IN_PRODUCTION', 'READY_TO_SHIP'],
  PAID_WAITING_APPROVAL: ['PROCESSING', 'IN_PRODUCTION', 'CANCELLED', 'REFUND_REQUESTED'],
  IN_PRODUCTION: ['WAITING_FINAL_PAYMENT', 'CANCELLED', 'READY_TO_SHIP'],
  WAITING_FINAL_PAYMENT: ['READY_TO_SHIP', 'CANCELLED', 'ABANDONED', 'ON_HOLD'],
  PROCESSING: ['READY_TO_SHIP', 'READY_FOR_DELIVERY', 'FAILED', 'ON_HOLD'],
  READY_TO_SHIP: ['SHIPPED', 'FAILED'],
  READY_FOR_DELIVERY: ['SHIPPED', 'FAILED', 'ON_HOLD'],
  SHIPPED: ['DELIVERED', 'COMPLETED', 'FAILED', 'RETURNED'],
  DELIVERED: ['COMPLETED', 'RETURNED'],
  COMPLETED: ['RETURNED'], // Final state but allows returns
  CANCELLED: [], // Final state
  ABANDONED: [], // Final state
  FAILED: ['PROCESSING', 'CANCELLED'], // Can retry or cancel
  ON_HOLD: ['PROCESSING', 'READY_FOR_DELIVERY', 'SHIPPED', 'CANCELLED', 'WAITING_FINAL_PAYMENT'],
  REFUND_REQUESTED: ['REFUNDED', 'CONFIRMED'],
  REFUNDED: [],
  RETURNED: [],
};

/**
 * Validate if status transition is allowed
 * @param {String} currentStatus - Current order status
 * @param {String} newStatus - New status to transition to
 * @throws {BadRequestError} if transition is invalid
 */
const validateStatusTransition = (currentStatus, newStatus) => {
  if (!validTransitions[currentStatus]) {
    throw new BadRequestError(`Invalid current status: ${currentStatus}`);
  }

  if (!validTransitions[currentStatus].includes(newStatus)) {
    throw new BadRequestError(
      `Cannot transition from ${currentStatus} to ${newStatus}. ` +
        `Valid transitions: ${validTransitions[currentStatus].join(', ')}`
    );
  }
};

/**
 * Validate specific transition rules
 * @param {Object} trx - Knex transaction
 * @param {Object} order - Order object with relations
 * @param {String} newStatus - New status
 * @throws {BadRequestError} if business rules violated
 */
const validateTransitionRules = async (trx, order, newStatus) => {
  // Check if it's a Custom Sablon order
  const isCustomSablon = await trx('designRequest').where('orderId', order.id).first();

  if (isCustomSablon) {
    if (
      order.status === 'PAID_WAITING_APPROVAL' &&
      !['IN_PRODUCTION', 'CANCELLED', 'REFUND_REQUESTED'].includes(newStatus)
    ) {
      throw new BadRequestError('Custom Sablon orders must go to IN_PRODUCTION after approval');
    }
  } else {
    if (
      order.status === 'PAID_WAITING_APPROVAL' &&
      !['PROCESSING', 'CANCELLED', 'REFUND_REQUESTED'].includes(newStatus)
    ) {
      throw new BadRequestError('Retail orders must go to PROCESSING after approval');
    }
  }

  // PENDING → CONFIRMED / PAID_WAITING_APPROVAL / READY_TO_SHIP: Only if Payment.status = 'COMPLETED'
  if (
    order.status === 'PENDING' &&
    ['CONFIRMED', 'PAID_WAITING_APPROVAL', 'READY_TO_SHIP'].includes(newStatus)
  ) {
    if (!order.payment || order.payment.status !== 'COMPLETED') {
      throw new BadRequestError('Cannot approve order without completed payment');
    }
  }

  // READY_TO_SHIP or READY_FOR_DELIVERY → SHIPPED: Require tracking number
  if (['READY_TO_SHIP', 'READY_FOR_DELIVERY'].includes(order.status) && newStatus === 'SHIPPED') {
    if (!order.trackingNumber && (!order.tracking || !order.tracking.trackingNumber)) {
      throw new BadRequestError('Tracking number required before shipping');
    }
  }
};

/**
 * Update order status with full audit trail
 * @param {String} orderId - Order ID
 * @param {String} newStatus - New status
 * @param {String} updatedBy - Admin/User ID making the change
 * @param {String} reason - Reason for status change
 * @param {String} notes - Additional notes
 * @returns {Promise<Object>} Updated order with history
 */
const updateOrderStatus = async (orderId, newStatus, updatedBy, reason = null, notes = null) => {
  return await knex.transaction(async (trx) => {
    // Get current order
    const order = await trx('order')
      .select('id', 'orderNumber', 'status', 'userId', 'trackingNumber')
      .where('id', orderId)
      .first();

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    // Get payment info for validation
    const payment = await trx('payment').select('status').where('orderId', orderId).first();

    // Get tracking info for validation
    const tracking = await trx('orderTracking')
      .select('trackingNumber')
      .where('orderId', orderId)
      .first();

    // Create order object for validation
    const orderWithRelations = {
      ...order,
      payment,
      tracking,
    };

    // Validate transition
    validateStatusTransition(order.status, newStatus);

    // Validate transition rules
    await validateTransitionRules(trx, orderWithRelations, newStatus);

    const previousStatus = order.status;

    // Update order status with optimistic locking (Race condition prevention)
    const updatedRows = await trx('order').where({ id: orderId, status: order.status }).update({
      status: newStatus,
      updatedAt: new Date(),
    });

    if (updatedRows === 0) {
      throw new BadRequestError('Race condition: Order status was changed by another process');
    }

    // Cancel related design requests if this is a Custom Sablon order
    if (newStatus === 'CANCELLED' && order.orderNumber && order.orderNumber.startsWith('SAB-')) {
      await trx('designRequest').where('orderId', orderId).update({
        status: 'CANCELLED',
        updatedAt: new Date(),
      });
    }

    // Award points if COMPLETED and order belongs to a user
    if (newStatus === 'COMPLETED' && order.userId) {
      const orderData = await trx('order').where('id', orderId).select('totalAmount').first();

      const earningRateSetting = await trx('store_settings')
        .where('settingKey', 'points_earning_rate')
        .first();
      const earningRate =
        earningRateSetting && !isNaN(Number(earningRateSetting.settingValue))
          ? Number(earningRateSetting.settingValue)
          : 10000;

      // Mencegah pembagian dengan 0 secara absolut (fallback to 10000)
      const safeRate = earningRate > 0 ? earningRate : 10000;

      const earnedPoints = Math.floor((orderData.totalAmount || 0) / safeRate);

      if (earnedPoints > 0) {
        // Update User table
        await trx('user').where('id', order.userId).increment('rewardPoints', earnedPoints);

        // Add point history
        await trx('pointHistory').insert({
          id: require('cuid')(),
          userId: order.userId,
          points: earnedPoints,
          type: 'EARNED',
          description: `Hadiah pesanan ${orderId.slice(0, 8)}`,
          createdAt: new Date(),
        });
      }

      // Update Customer Metrics
      const metrics = await trx('customerMetrics').where('userId', order.userId).first();
      if (metrics) {
        const newTotalTransactions = (metrics.totalTransactions || 0) + 1;
        const newTotalSpent =
          parseFloat(metrics.totalSpent || 0) + parseFloat(orderData.totalAmount || 0);
        const newAverageOrderValue = newTotalSpent / newTotalTransactions;

        // Fetch tier thresholds
        const tierSettings = await trx('store_settings').whereIn('settingKey', [
          'tier_silver_min',
          'tier_gold_min',
          'tier_platinum_min',
        ]);

        const getTierMin = (key, defaultMin) => {
          const setting = tierSettings.find((s) => s.settingKey === key);
          return setting && !isNaN(Number(setting.settingValue))
            ? Number(setting.settingValue)
            : defaultMin;
        };

        const platinumMin = getTierMin('tier_platinum_min', 5000000);
        const goldMin = getTierMin('tier_gold_min', 2000000);
        const silverMin = getTierMin('tier_silver_min', 500000);

        // Tier calculation
        let newTier = metrics.currentTier || 'BRONZE';
        if (!metrics.isTierManuallySet) {
          if (newTotalSpent >= platinumMin) newTier = 'PLATINUM';
          else if (newTotalSpent >= goldMin) newTier = 'GOLD';
          else if (newTotalSpent >= silverMin) newTier = 'SILVER';
          else newTier = 'BRONZE';
        }

        await trx('customerMetrics')
          .where('userId', order.userId)
          .update({
            totalTransactions: newTotalTransactions,
            totalSpent: newTotalSpent,
            averageOrderValue: newAverageOrderValue,
            loyaltyPoints: (metrics.loyaltyPoints || 0) + earnedPoints,
            currentTier: newTier,
            updatedAt: new Date(),
          });
      }
    }

    // Create status history record
    const cuid = require('cuid');
    await trx('orderStatusHistory').insert({
      id: cuid(),
      orderId,
      previousStatus,
      newStatus,
      reason,
      updatedBy,
      notes,
      createdAt: new Date(),
    });

    // Trigger notification
    await triggerStatusNotification(trx, orderId, newStatus, orderWithRelations);

    // Return updated order
    return await trx('order')
      .select('id', 'orderNumber', 'status', 'totalAmount', 'createdAt')
      .where('id', orderId)
      .first();
  });
};

/**
 * Create notification for status change
 * @param {Object} trx - Knex transaction client
 * @param {String} orderId - Order ID
 * @param {String} status - Order status
 * @param {Object} order - Order object
 */
const triggerStatusNotification = async (trx, orderId, status, order) => {
  const notificationConfig = {
    CONFIRMED: {
      title: 'Pesanan Dikonfirmasi! 🎉',
      message: 'Pesanan Anda telah kami terima dan akan segera disiapkan.',
      type: 'CONFIRMED',
    },
    PROCESSING: {
      title: 'Pesanan Sedang Disiapkan',
      message: 'Pesanan Anda saat ini sedang dalam proses penyiapan oleh tim kami.',
      type: 'PROCESSING',
    },
    IN_PRODUCTION: {
      title: 'Pesanan Diproses ⚙️',
      message: 'Pesanan Anda saat ini sedang dalam tahap produksi oleh tim kami.',
      type: 'IN_PRODUCTION',
    },
    READY_TO_SHIP: {
      title: 'Pesanan Siap Dikirim/Diambil 📦',
      message:
        'Pesanan Anda sudah selesai dikemas dan siap untuk dikirim oleh kurir atau diambil di toko.',
      type: 'READY_TO_SHIP',
    },
    READY_FOR_DELIVERY: {
      title: 'Pesanan Menunggu Penjemputan Kurir',
      message: 'Pesanan Anda sudah siap dan sedang menunggu dijemput oleh pihak kurir.',
      type: 'READY_FOR_DELIVERY',
    },
    SHIPPED: {
      title: 'Pesanan Telah Dikirim! 📦',
      message: 'Pesanan Anda telah diserahkan ke kurir. Silakan cek nomor resi Anda.',
      type: 'SHIPPED',
    },
    DELIVERED: {
      title: 'Pesanan Telah Tiba! ✅',
      message: 'Pesanan Anda telah sampai di tujuan. Terima kasih telah berbelanja di AriaNation!',
      type: 'DELIVERED',
    },
    COMPLETED: {
      title: 'PESANAN SELESAI! 🚀',
      message: 'Pesanan Anda telah selesai. Poin hadiah telah ditambahkan ke akun Anda!',
      type: 'COMPLETED',
    },
    CANCELLED: {
      title: 'Pesanan Dibatalkan',
      message: 'Pesanan Anda telah dibatalkan. Silakan hubungi admin jika ada pertanyaan.',
      type: 'CANCELLED',
    },
    FAILED: {
      title: 'Pesanan Bermasalah ⚠️',
      message: 'Terjadi masalah dengan pesanan Anda. Silakan hubungi admin untuk bantuan.',
      type: 'FAILED',
    },
    ABANDONED: {
      title: 'Pesanan Dibatalkan Otomatis ❌',
      message:
        'Mohon Maaf, pesanan Sablon Anda telah dibatalkan oleh sistem karena melewati batas waktu pelunasan 7 hari. Sesuai S&K, Uang Muka (DP) tidak dapat dikembalikan.',
      type: 'ABANDONED',
    },
    ON_HOLD: {
      title: 'Pesanan Dibekukan (ON HOLD) ⏸️',
      message:
        'Pesanan Anda dibekukan karena ada permasalahan (misal: melewati batas waktu pelunasan).',
      type: 'ON_HOLD',
    },
    REFUND_REQUESTED: {
      title: 'Permintaan Refund Diterima',
      message: 'Permintaan pembatalan dan refund Anda sedang diproses oleh admin.',
      type: 'REFUND_REQUESTED',
    },
    REFUNDED: {
      title: 'Refund Berhasil ✅',
      message: 'Pengembalian dana (refund) untuk pesanan Anda telah berhasil diproses.',
      type: 'REFUNDED',
    },
    RETURNED: {
      title: 'Pesanan Diretur / Dikembalikan',
      message: 'Pesanan Anda telah diretur ke pihak Arianation.',
      type: 'RETURNED',
    },
  };

  const config = notificationConfig[status];
  if (config) {
    try {
      const notificationService = require('./notificationService');
      const notif = await notificationService.queueCustomerNotification({
        referenceId: orderId,
        referenceType: 'ORDER',
        userId: order.userId || null,
        type: config.type,
        title: config.title,
        message: config.message,
      }, trx);

      // Also trigger the email sending process
      if (notif && notif.id) {
        notificationService.sendOrderNotification(notif.id).catch((err) => {
          console.error('Failed to send order notification email:', err);
        });
      }
    } catch (err) {
      console.error('Failed to trigger customer notification:', err);
    }
  }
};

/**
 * Get order status history
 * @param {String} orderId - Order ID
 * @returns {Promise<Array>} Status history records
 */
const getOrderStatusHistory = async (orderId) => {
  return await knex('orderStatusHistory')
    .select('id', 'previousStatus', 'newStatus', 'reason', 'updatedBy', 'createdAt')
    .where('orderId', orderId)
    .orderBy('createdAt', 'desc');
};

/**
 * Get order timeline (combined status history + tracking)
 * @param {String} orderId - Order ID
 * @returns {Promise<Object>} Timeline with status and tracking history
 */
const getOrderTimeline = async (orderId) => {
  const [statusHistory, tracking] = await Promise.all([
    knex('orderStatusHistory')
      .select('id', 'newStatus', 'createdAt as timestamp', 'reason', 'updatedBy')
      .where('orderId', orderId)
      .orderBy('createdAt', 'desc'),
    knex('orderTracking')
      .select('id', 'orderId', 'status', 'carrier', 'trackingNumber')
      .where('orderId', orderId)
      .first(),
  ]);

  // Get tracking history
  const trackingHistory = tracking
    ? await knex('trackingHistory')
        .select('status', 'timestamp', 'location', 'notes')
        .where('trackingId', tracking.id)
        .orderBy('timestamp', 'desc')
    : [];

  // Merge and sort by timestamp
  const timeline = [
    ...statusHistory.map((h) => ({
      type: 'STATUS_CHANGE',
      status: h.newStatus,
      timestamp: h.timestamp,
      details: h,
    })),
    ...trackingHistory.map((h) => ({
      type: 'TRACKING_UPDATE',
      status: h.status,
      timestamp: h.timestamp,
      details: h,
    })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return {
    orderId,
    currentStatus: statusHistory[0]?.newStatus || 'PENDING',
    timeline,
    trackingInfo: tracking,
  };
};

/**
 * Get pending notifications for order
 * @param {String} orderId - Order ID
 * @returns {Promise<Array>} Notifications
 */
const getOrderNotifications = async (orderId) => {
  return await knex('orderNotification')
    .select('id', 'type', 'title', 'message', 'emailSent', 'createdAt')
    .where('orderId', orderId)
    .orderBy('createdAt', 'desc');
};

/**
 * Update or create order tracking information
 * @param {String} orderId - Order ID
 * @param {Object} payload - Tracking fields
 * @returns {Promise<Object>} Updated tracking record
 */
const updateOrderTracking = async (orderId, payload = {}) => {
  const order = await knex('order').where('id', orderId).select('id', 'status').first();

  if (!order) {
    throw new BadRequestError('Order not found');
  }

  const tracking = await knex('orderTracking').where('orderId', orderId).first();
  const nextStatus = payload.status || tracking?.status || 'PROCESSING';

  let trackingRecord;
  if (tracking) {
    // Update existing
    await knex('orderTracking')
      .where('orderId', orderId)
      .update({
        status: nextStatus,
        currentLocation: payload.currentLocation ?? tracking.currentLocation ?? null,
        estimatedDeliveryDate: payload.estimatedDeliveryDate
          ? new Date(payload.estimatedDeliveryDate)
          : tracking.estimatedDeliveryDate || null,
        carrier: payload.carrier ?? tracking.carrier ?? null,
        trackingNumber: payload.trackingNumber ?? tracking.trackingNumber ?? null,
        lastUpdate: new Date(),
        notes: payload.notes ?? tracking.notes ?? null,
      });
    trackingRecord = await knex('orderTracking').where('orderId', orderId).first();
  } else {
    // Create new
    const cuid = require('cuid');
    const newTracking = {
      id: cuid(),
      orderId,
      status: nextStatus,
      currentLocation: payload.currentLocation || null,
      estimatedDeliveryDate: payload.estimatedDeliveryDate
        ? new Date(payload.estimatedDeliveryDate)
        : null,
      carrier: payload.carrier || null,
      trackingNumber: payload.trackingNumber || null,
      lastUpdate: new Date(),
      notes: payload.notes || null,
      updatedAt: new Date(),
    };
    await knex('orderTracking').insert(newTracking);
    trackingRecord = newTracking;
  }

  if (payload.status || payload.currentLocation || payload.notes) {
    const cuid = require('cuid');
    await knex('trackingHistory').insert({
      id: cuid(),
      trackingId: trackingRecord.id,
      status: nextStatus,
      location: payload.currentLocation || null,
      notes: payload.notes || null,
      timestamp: new Date(),
    });
  }

  return trackingRecord;
};

/**
 * Mark notification as sent
 * @param {String} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
const markNotificationAsSent = async (notificationId) => {
  return await knex('orderNotification').where('id', notificationId).update({
    emailSent: true,
    sentAt: new Date(),
  });
};

module.exports = {
  validateStatusTransition,
  validateTransitionRules,
  updateOrderStatus,
  triggerStatusNotification,
  getOrderStatusHistory,
  getOrderTimeline,
  getOrderNotifications,
  updateOrderTracking,
  markNotificationAsSent,
};

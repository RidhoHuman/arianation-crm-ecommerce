// src/services/orderFulfillmentService.js

const knex = require('../config/knex');
const { BadRequestError } = require('../utils/errors');

// Valid status transitions
const validTransitions = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY_FOR_DELIVERY', 'FAILED'],
  READY_FOR_DELIVERY: ['SHIPPED', 'FAILED'],
  SHIPPED: ['DELIVERED', 'FAILED'],
  DELIVERED: [], // Final state
  CANCELLED: [], // Final state
  FAILED: ['PROCESSING', 'CANCELLED'], // Can retry or cancel
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
 * @param {Object} order - Order object with relations
 * @param {String} newStatus - New status
 * @throws {BadRequestError} if business rules violated
 */
const validateTransitionRules = async (order, newStatus) => {
  // PENDING → CONFIRMED: Only if Payment.status = 'COMPLETED'
  if (order.status === 'PENDING' && newStatus === 'CONFIRMED') {
    if (!order.payment || order.payment.status !== 'COMPLETED') {
      throw new BadRequestError('Cannot confirm order without completed payment');
    }
  }

  // CONFIRMED → PROCESSING: Check stock availability (optional for now)
  if (order.status === 'CONFIRMED' && newStatus === 'PROCESSING') {
    // Future: Check product stock
  }

  // READY_FOR_DELIVERY → SHIPPED: Require tracking number
  if (order.status === 'READY_FOR_DELIVERY' && newStatus === 'SHIPPED') {
    if (!order.tracking || !order.tracking.trackingNumber) {
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
      .select('id', 'status', 'userId')
      .where('id', orderId)
      .first();

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    // Get payment info for validation
    const payment = await trx('payment')
      .select('status')
      .where('orderId', orderId)
      .first();

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
    await validateTransitionRules(orderWithRelations, newStatus);

    const previousStatus = order.status;

    // Update order status
    await trx('order')
      .where('id', orderId)
      .update({
        status: newStatus,
        updatedAt: new Date(),
      });

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
      title: 'Order Confirmed! 🎉',
      message: 'Your order has been confirmed. We will prepare it shortly.',
      type: 'CONFIRMED',
    },
    PROCESSING: {
      title: 'Order is Being Prepared',
      message: 'Your order is currently being prepared for shipment.',
      type: 'PROCESSING',
    },
    READY_FOR_DELIVERY: {
      title: 'Ready for Pickup',
      message: 'Your order is ready and will be picked up by courier soon.',
      type: 'READY_FOR_DELIVERY',
    },
    SHIPPED: {
      title: 'Order Shipped! 📦',
      message: 'Your order has been shipped. Check tracking info for details.',
      type: 'SHIPPED',
    },
    DELIVERED: {
      title: 'Order Delivered! ✅',
      message: 'Your order has been delivered. Thank you for your purchase!',
      type: 'DELIVERED',
    },
    CANCELLED: {
      title: 'Order Cancelled',
      message: 'Your order has been cancelled. Please contact support for details.',
      type: 'CANCELLED',
    },
    FAILED: {
      title: 'Order Issue ⚠️',
      message: 'There was an issue with your order. Please contact support.',
      type: 'FAILED',
    },
  };

  const config = notificationConfig[status];
  if (config) {
    const cuid = require('cuid');
    await trx('orderNotification').insert({
      id: cuid(),
      orderId,
      userId: order.userId || null,
      type: config.type,
      title: config.title,
      message: config.message,
      emailSent: false,
      createdAt: new Date(),
    });
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
  const trackingHistory = tracking ? await knex('trackingHistory')
    .select('status', 'timestamp', 'location', 'notes')
    .where('trackingId', tracking.id)
    .orderBy('timestamp', 'desc') : [];

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
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { tracking: true },
  });

  if (!order) {
    throw new BadRequestError('Order not found');
  }

  const nextStatus = payload.status || order.tracking?.status || 'PROCESSING';
  const tracking = await prisma.orderTracking.upsert({
    where: { orderId },
    update: {
      status: nextStatus,
      currentLocation: payload.currentLocation ?? order.tracking?.currentLocation ?? null,
      estimatedDeliveryDate: payload.estimatedDeliveryDate
        ? new Date(payload.estimatedDeliveryDate)
        : order.tracking?.estimatedDeliveryDate || null,
      carrier: payload.carrier ?? order.tracking?.carrier ?? null,
      trackingNumber: payload.trackingNumber ?? order.tracking?.trackingNumber ?? null,
      lastUpdate: new Date(),
      notes: payload.notes ?? order.tracking?.notes ?? null,
    },
    create: {
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
    },
  });

  if (payload.status || payload.currentLocation || payload.notes) {
    await prisma.trackingHistory.create({
      data: {
        trackingId: tracking.id,
        status: nextStatus,
        location: payload.currentLocation || null,
        notes: payload.notes || null,
      },
    });
  }

  return tracking;
};

/**
 * Mark notification as sent
 * @param {String} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
const markNotificationAsSent = async (notificationId) => {
  return await knex('orderNotification')
    .where('id', notificationId)
    .update({
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

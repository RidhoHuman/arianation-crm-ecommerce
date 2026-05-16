// src/services/orderFulfillmentService.js

const prisma = require('../config/database');
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
      throw new BadRequestError(
        'Cannot confirm order without completed payment'
      );
    }
  }

  // CONFIRMED → PROCESSING: Check stock availability (optional for now)
  if (order.status === 'CONFIRMED' && newStatus === 'PROCESSING') {
    // Future: Check product stock
  }

  // READY_FOR_DELIVERY → SHIPPED: Require tracking number
  if (order.status === 'READY_FOR_DELIVERY' && newStatus === 'SHIPPED') {
    if (!order.tracking || !order.tracking.trackingNumber) {
      throw new BadRequestError(
        'Tracking number required before shipping'
      );
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
const updateOrderStatus = async (
  orderId,
  newStatus,
  updatedBy,
  reason = null,
  notes = null
) => {
  return await prisma.$transaction(async (tx) => {
    // Get current order
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        tracking: true,
        items: true,
      },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    // Validate transition
    validateStatusTransition(order.status, newStatus);

    // Validate transition rules
    await validateTransitionRules(order, newStatus);

    const previousStatus = order.status;

    // Update order status
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    // Create status history record
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        previousStatus,
        newStatus,
        reason,
        updatedBy,
        notes,
      },
    });

    // Trigger notification
    await triggerStatusNotification(tx, orderId, newStatus, order);

    return updatedOrder;
  });
};

/**
 * Create notification for status change
 * @param {Object} tx - Prisma transaction client
 * @param {String} orderId - Order ID
 * @param {String} status - Order status
 * @param {Object} order - Order object
 */
const triggerStatusNotification = async (tx, orderId, status, order) => {
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
    await tx.orderNotification.create({
      data: {
        orderId,
        userId: order.userId || null,
        type: config.type,
        title: config.title,
        message: config.message,
        emailSent: false,
      },
    });
  }
};

/**
 * Get order status history
 * @param {String} orderId - Order ID
 * @returns {Promise<Array>} Status history records
 */
const getOrderStatusHistory = async (orderId) => {
  return await prisma.orderStatusHistory.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Get order timeline (combined status history + tracking)
 * @param {String} orderId - Order ID
 * @returns {Promise<Object>} Timeline with status and tracking history
 */
const getOrderTimeline = async (orderId) => {
  const [statusHistory, tracking] = await Promise.all([
    prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.orderTracking.findUnique({
      where: { orderId },
      include: {
        history: {
          orderBy: { timestamp: 'desc' },
        },
      },
    }),
  ]);

  // Merge and sort by timestamp
  const timeline = [
    ...statusHistory.map((h) => ({
      type: 'STATUS_CHANGE',
      status: h.newStatus,
      timestamp: h.createdAt,
      details: h,
    })),
    ...(tracking?.history || []).map((h) => ({
      type: 'TRACKING_UPDATE',
      status: h.status,
      timestamp: h.timestamp,
      details: h,
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

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
  return await prisma.orderNotification.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  });
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
      estimatedDeliveryDate: payload.estimatedDeliveryDate ? new Date(payload.estimatedDeliveryDate) : null,
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
  return await prisma.orderNotification.update({
    where: { id: notificationId },
    data: {
      emailSent: true,
      sentAt: new Date(),
    },
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

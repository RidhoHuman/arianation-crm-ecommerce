// src/services/batchOperationsService.js

const prisma = require('../config/database');
const orderFulfillmentService = require('./orderFulfillmentService');
const { BadRequestError } = require('../utils/errors');

/**
 * Batch update order statuses
 * @param {Array} orderIds - Array of order IDs to update
 * @param {String} newStatus - Target status
 * @param {String} updatedBy - Admin ID performing the operation
 * @param {String} reason - Reason for bulk update
 * @returns {Promise<Object>} Result with success count and failed orders
 */
const batchUpdateOrderStatus = async (orderIds, newStatus, updatedBy, reason = null) => {
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    throw new BadRequestError('orderIds must be a non-empty array');
  }

  if (orderIds.length > 100) {
    throw new BadRequestError('Maximum 100 orders per batch operation');
  }

  const results = {
    total: orderIds.length,
    successful: 0,
    failed: 0,
    errors: [],
  };

  // Process each order
  for (const orderId of orderIds) {
    try {
      await orderFulfillmentService.updateOrderStatus(
        orderId,
        newStatus,
        updatedBy,
        reason || `Batch update to ${newStatus}`
      );
      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        orderId,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Batch cancel orders
 * @param {Array} orderIds - Array of order IDs to cancel
 * @param {String} cancelledBy - Admin ID performing cancellation
 * @param {String} reason - Cancellation reason
 * @returns {Promise<Object>} Batch operation result
 */
const batchCancelOrders = async (orderIds, cancelledBy, reason = 'Bulk cancellation') => {
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    throw new BadRequestError('orderIds must be a non-empty array');
  }

  if (orderIds.length > 100) {
    throw new BadRequestError('Maximum 100 orders per batch operation');
  }

  const results = {
    total: orderIds.length,
    successful: 0,
    failed: 0,
    errors: [],
  };

  for (const orderId of orderIds) {
    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });

      if (!order) {
        throw new BadRequestError('Order not found');
      }

      // Only cancel if not already in final state
      if (['DELIVERED', 'CANCELLED', 'FAILED'].includes(order.status)) {
        throw new BadRequestError(`Cannot cancel order with status: ${order.status}`);
      }

      await orderFulfillmentService.updateOrderStatus(
        orderId,
        'CANCELLED',
        cancelledBy,
        reason
      );
      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        orderId,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Batch update tracking information
 * @param {Array} updates - Array of tracking updates [{orderId, trackingNumber, carrier, ...}]
 * @returns {Promise<Object>} Batch operation result
 */
const batchUpdateTracking = async (updates) => {
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new BadRequestError('updates must be a non-empty array');
  }

  if (updates.length > 100) {
    throw new BadRequestError('Maximum 100 updates per batch operation');
  }

  const results = {
    total: updates.length,
    successful: 0,
    failed: 0,
    errors: [],
  };

  for (const update of updates) {
    try {
      const { orderId, ...trackingData } = update;

      if (!orderId) {
        throw new BadRequestError('orderId is required for each update');
      }

      await orderFulfillmentService.updateOrderTracking(orderId, trackingData);
      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        orderId: update.orderId,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Batch send notifications
 * @param {Array} orderIds - Order IDs to send notifications for
 * @returns {Promise<Object>} Batch operation result
 */
const batchSendNotifications = async (orderIds) => {
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    throw new BadRequestError('orderIds must be a non-empty array');
  }

  if (orderIds.length > 100) {
    throw new BadRequestError('Maximum 100 notifications per batch operation');
  }

  const results = {
    total: orderIds.length,
    successful: 0,
    failed: 0,
    errors: [],
  };

  for (const orderId of orderIds) {
    try {
      const notifications = await prisma.orderNotification.findMany({
        where: { orderId, emailSent: false },
      });

      for (const notification of notifications) {
        // Trigger notification service (simplified)
        const notificationService = require('./notificationService');
        await notificationService.queueNotification({
          orderId,
          userId: notification.userId,
          recipientEmail: notification.recipientEmail,
          type: notification.type,
          title: notification.title,
          message: notification.message,
        });
      }

      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        orderId,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Get orders for batch operation with filters
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Array>} Matching orders
 */
const getOrdersForBatch = async (filters = {}) => {
  const {
    status,
    paymentStatus,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    limit = 50,
  } = filters;

  const where = {};

  if (status) where.status = status;
  if (paymentStatus) where.payment = { status: paymentStatus };

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  if (minAmount || maxAmount) {
    if (minAmount) where.totalAmount = { gte: minAmount };
    if (maxAmount) {
      where.totalAmount = { ...where.totalAmount, lte: maxAmount };
    }
  }

  return await prisma.order.findMany({
    where,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 100),
  });
};

module.exports = {
  batchUpdateOrderStatus,
  batchCancelOrders,
  batchUpdateTracking,
  batchSendNotifications,
  getOrdersForBatch,
};

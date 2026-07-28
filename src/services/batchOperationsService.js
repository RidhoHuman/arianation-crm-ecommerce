// src/services/batchOperationsService.js

const knex = require('../config/knex');
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
      const order = await knex('order').select('id', 'status').where('id', orderId).first();

      if (!order) {
        throw new BadRequestError('Order not found');
      }

      // Only cancel if not already in final state
      if (['DELIVERED', 'CANCELLED', 'FAILED'].includes(order.status)) {
        throw new BadRequestError(`Cannot cancel order with status: ${order.status}`);
      }

      await orderFulfillmentService.updateOrderStatus(orderId, 'CANCELLED', cancelledBy, reason);
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
      const notifications = await knex('orderNotification')
        .select('id', 'userId', 'recipientEmail', 'type', 'title', 'message')
        .where('orderId', orderId)
        .where('emailSent', false);

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
  const { status, paymentStatus, dateFrom, dateTo, minAmount, maxAmount, limit = 50 } = filters;

  let query = knex('order');

  if (status) {
    query = query.where('status', status);
  }

  if (dateFrom || dateTo) {
    if (dateFrom) query = query.where('createdAt', '>=', new Date(dateFrom));
    if (dateTo) query = query.where('createdAt', '<=', new Date(dateTo));
  }

  if (minAmount) {
    query = query.where('totalAmount', '>=', minAmount);
  }

  if (maxAmount) {
    query = query.where('totalAmount', '<=', maxAmount);
  }

  // Note: paymentStatus filter would require a join, skipping for now
  // as it's not critical for batch operations

  return await query
    .select('id', 'orderNumber', 'status', 'totalAmount', 'createdAt')
    .orderBy('createdAt', 'desc')
    .limit(Math.min(limit, 100));
};

module.exports = {
  batchUpdateOrderStatus,
  batchCancelOrders,
  batchUpdateTracking,
  batchSendNotifications,
  getOrdersForBatch,
};

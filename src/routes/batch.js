// src/routes/batch.js

const express = require('express');
const router = express.Router();
const batchOperationsService = require('../services/batchOperationsService');
const { authenticate, authorize } = require('../middleware/auth');

// All batch operations require OWNER/ADMIN role
router.use(authenticate);
router.use(authorize(['OWNER', 'ADMIN']));

/**
 * GET /api/batch/preview
 * Preview orders for batch operation with filters
 */
router.get('/preview', async (req, res, next) => {
  try {
    const { status, paymentStatus, dateFrom, dateTo, limit } = req.query;

    const orders = await batchOperationsService.getOrdersForBatch({
      status,
      paymentStatus,
      dateFrom,
      dateTo,
      limit: parseInt(limit) || 50,
    });

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/batch/update-status
 * Bulk update order statuses
 * Body: { orderIds: [id1, id2, ...], newStatus: "CONFIRMED", reason?: "..." }
 */
router.post('/update-status', async (req, res, next) => {
  try {
    const { orderIds, newStatus, reason } = req.body;

    if (!orderIds || !newStatus) {
      return res.status(400).json({
        success: false,
        message: 'orderIds and newStatus are required',
      });
    }

    const result = await batchOperationsService.batchUpdateOrderStatus(
      orderIds,
      newStatus,
      req.user.id,
      reason
    );

    res.json({
      success: true,
      message: `Batch update completed: ${result.successful} successful, ${result.failed} failed`,
      result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/batch/cancel
 * Bulk cancel orders
 * Body: { orderIds: [id1, id2, ...], reason?: "..." }
 */
router.post('/cancel', async (req, res, next) => {
  try {
    const { orderIds, reason } = req.body;

    if (!orderIds || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'orderIds is required',
      });
    }

    const result = await batchOperationsService.batchCancelOrders(
      orderIds,
      req.user.id,
      reason || 'Bulk cancellation'
    );

    res.json({
      success: true,
      message: `Batch cancellation completed: ${result.successful} successful, ${result.failed} failed`,
      result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/batch/update-tracking
 * Bulk update tracking information
 * Body: { updates: [{orderId, trackingNumber, carrier, ...}, ...] }
 */
router.post('/update-tracking', async (req, res, next) => {
  try {
    const { updates } = req.body;

    if (!updates || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'updates array is required',
      });
    }

    const result = await batchOperationsService.batchUpdateTracking(updates);

    res.json({
      success: true,
      message: `Batch tracking update completed: ${result.successful} successful, ${result.failed} failed`,
      result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/batch/send-notifications
 * Bulk send notifications
 * Body: { orderIds: [id1, id2, ...] }
 */
router.post('/send-notifications', async (req, res, next) => {
  try {
    const { orderIds } = req.body;

    if (!orderIds || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'orderIds is required',
      });
    }

    const result = await batchOperationsService.batchSendNotifications(
      orderIds
    );

    res.json({
      success: true,
      message: `Batch notification completed: ${result.successful} successful, ${result.failed} failed`,
      result,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

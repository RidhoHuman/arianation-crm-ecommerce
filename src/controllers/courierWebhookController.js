// src/controllers/courierWebhookController.js

const orderService = require('../services/orderService');
const knex = require('../config/knex');
const { config } = require('../config/env');
const { sendSuccess } = require('../utils/response');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { MESSAGES } = require('../utils/constants');
const orderFulfillmentService = require('../services/orderFulfillmentService');

const normalizeTrackingStatus = (status) => {
  const normalized = String(status || '')
    .trim()
    .toUpperCase();

  const mapping = {
    PROCESSING: 'PROCESSING',
    PACKED: 'PACKED',
    SHIPPED: 'SHIPPED',
    IN_DELIVERY: 'IN_DELIVERY',
    OUT_FOR_DELIVERY: 'IN_DELIVERY',
    DELIVERED: 'DELIVERED',
    FAILED: 'FAILED',
    RETURNED: 'FAILED',
  };

  return mapping[normalized] || null;
};

const updateCourierWebhook = async (req, res, next) => {
  try {
    const verifyToken = req.headers['x-webhook-token'] || req.headers['x-courier-token'];
    if (config.xendit.webhookToken && verifyToken !== config.xendit.webhookToken) {
      throw new BadRequestError('Invalid webhook token');
    }

    const payload = req.body || {};
    const orderId =
      payload.orderId || payload.order_id || payload.referenceId || payload.reference_id;
    const trackingNumber = payload.trackingNumber || payload.tracking_number || null;
    const carrier = payload.carrier || payload.courier || payload.shippingProvider || null;
    const status = normalizeTrackingStatus(
      payload.status || payload.trackingStatus || payload.event
    );
    const currentLocation = payload.currentLocation || payload.current_location || null;
    const estimatedDeliveryDate =
      payload.estimatedDeliveryDate || payload.estimated_delivery_date || null;
    const notes = payload.notes || payload.message || null;

    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const order = await orderService.findById(orderId);

    if (!order) {
      throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);
    }

    // Get existing tracking if any
    const existingTracking = await knex('orderTracking').where('orderId', orderId).first();

    let tracking;
    if (existingTracking) {
      // Update existing tracking
      await knex('orderTracking').where('orderId', orderId).update({
        status: status || existingTracking.status || 'PROCESSING',
        currentLocation: currentLocation || existingTracking.currentLocation || null,
        estimatedDeliveryDate: estimatedDeliveryDate
          ? new Date(estimatedDeliveryDate)
          : existingTracking.estimatedDeliveryDate || null,
        carrier: carrier || existingTracking.carrier || null,
        trackingNumber: trackingNumber || existingTracking.trackingNumber || null,
        lastUpdate: new Date(),
        notes: notes || existingTracking.notes || null,
      });
      tracking = await knex('orderTracking').where('orderId', orderId).first();
    } else {
      // Create new tracking
      const trackingId = require('cuid')();
      await knex('orderTracking').insert({
        id: trackingId,
        orderId,
        status: status || 'PROCESSING',
        currentLocation,
        estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
        carrier,
        trackingNumber,
        lastUpdate: new Date(),
        notes,
        updatedAt: new Date(),
      });
      tracking = await knex('orderTracking').where('id', trackingId).first();
    }

    if (status) {
      await knex('trackingHistory').insert({
        id: require('cuid')(),
        trackingId: tracking.id,
        status,
        location: currentLocation,
        notes,
        timestamp: new Date(),
      });
    }

    if (status === 'DELIVERED') {
      await orderFulfillmentService.updateOrderStatus(
        orderId,
        'DELIVERED',
        'SYSTEM',
        'Courier webhook reported delivered',
        notes
      );
    }

    if (status === 'SHIPPED' && order.status === 'READY_FOR_DELIVERY') {
      await orderFulfillmentService.updateOrderStatus(
        orderId,
        'SHIPPED',
        'SYSTEM',
        'Courier webhook reported shipped',
        notes
      );
    }

    return sendSuccess(
      res,
      {
        orderId,
        trackingId: tracking.id,
        status: tracking.status,
        trackingNumber: tracking.trackingNumber,
      },
      'Courier webhook processed successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { updateCourierWebhook };

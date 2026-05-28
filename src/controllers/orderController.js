// src/controllers/orderController.js

const orderService = require('../services/orderService');
const knex = require('../config/knex');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { NotFoundError, BadRequestError, AuthorizationError } = require('../utils/errors');
const { MESSAGES } = require('../utils/constants');
const orderFulfillmentService = require('../services/orderFulfillmentService');

const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { status, userId, dateFrom, dateTo } = req.query;

    const filterUserId = ['CUSTOMER'].includes(req.user.role) ? req.user.id : userId;

    const [orders, total] = await Promise.all([
      orderService.findMany({ page, limit, userId: filterUserId, status }),
      orderService.count({ userId: filterUserId, status }),
    ]);

    return sendPaginated(
      res,
      orders,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      MESSAGES.ORDERS_FOUND
    );
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await orderService.findById(id);

    if (!order) {
      throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);
    }

    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    return sendSuccess(res, order, MESSAGES.ORDER_FOUND);
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { paymentMethod, deliveryAddress, notes, items } = req.body;

    let orderItems = [];

    if (items && Array.isArray(items) && items.length > 0) {
      const productIds = [...new Set(items.map((item) => item.productId))];
      const variantIds = [...new Set(items.filter((item) => item.variantId).map((i) => i.variantId))];

      const [products, variants] = await Promise.all([
        knex('product').whereIn('id', productIds),
        knex('productVariant').whereIn('id', variantIds),
      ]);

      const productsById = new Map(products.map((p) => [p.id, p]));
      const variantsById = new Map(variants.map((v) => [v.id, v]));

      orderItems = items.map((item) => {
        const product = productsById.get(item.productId);
        if (!product || !product.isActive) {
          throw new NotFoundError(`Product ${item.productId} not found`);
        }

        let unitPrice = product.price;
        if (item.variantId) {
          const variant = variantsById.get(item.variantId);
          if (variant) unitPrice += variant.additionalPrice;
        }

        return {
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          unitPrice,
          subtotal: unitPrice * item.quantity,
          notes: item.notes || null,
        };
      });
    } else {
      const cart = await knex('shoppingCart').where('userId', userId).first();
      const cartItems = cart ? await knex('cartItem').where('cartId', cart.id) : [];

      if (!cartItems || cartItems.length === 0) {
        throw new BadRequestError(MESSAGES.CART_EMPTY);
      }

      orderItems = cartItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        unitPrice: item.price || item.unitPrice,
        subtotal: item.subtotal || (item.price * item.quantity),
      }));
    }

    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Buat order dan order items dalam transaksi
    const order = await knex.transaction(async (trx) => {
      const orderId = require('cuid')();

      await trx('order').insert({
        id: orderId,
        userId,
        totalAmount,
        paymentMethod,
        deliveryAddress: deliveryAddress || null,
        notes: notes || null,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const itemRecords = orderItems.map((it) => ({
        id: require('cuid')(),
        orderId,
        productId: it.productId,
        variantId: it.variantId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal,
        notes: it.notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      if (itemRecords.length) {
        await trx('orderItem').insert(itemRecords);
      }

      return await trx('order').where('id', orderId).first();
    });

    if (!items) {
      const cart = await knex('shoppingCart').where('userId', userId).first();
      if (cart) {
        await knex('cartItem').where('cartId', cart.id).delete();
      }
    }

    return sendCreated(res, order, MESSAGES.ORDER_CREATED);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason, notes } = req.body;

    // Use fulfillment service for validated status update
    const updatedOrder = await orderFulfillmentService.updateOrderStatus(
      id,
      status,
      req.user.id, // updatedBy
      reason,
      notes
    );

    return sendSuccess(res, updatedOrder, 'Order status updated successfully');
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await orderService.findById(id);
    if (!order) throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);

    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    const cancellableStatuses = ['PENDING', 'CONFIRMED'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestError(MESSAGES.ORDER_CANNOT_CANCEL);
    }

    const updatedOrder = await orderService.update(id, { status: 'CANCELLED' });

    return sendSuccess(res, updatedOrder, MESSAGES.ORDER_CANCELLED);
  } catch (error) {
    next(error);
  }
};

const getOrderTracking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await orderService.findById(id);
    if (!order) throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);

    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    const tracking = await knex('orderTracking').where('orderId', id).first();
    if (tracking) {
      tracking.history = await knex('trackingHistory')
        .where('orderTrackingId', tracking.id)
        .orderBy('timestamp', 'desc');
    }

    return sendSuccess(res, tracking, 'Tracking information retrieved');
  } catch (error) {
    next(error);
  }
};

const getOrderStatusHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await orderService.findById(id);
    if (!order) throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);

    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    const history = await orderFulfillmentService.getOrderStatusHistory(id);

    return sendSuccess(res, history, 'Order status history retrieved');
  } catch (error) {
    next(error);
  }
};

const getOrderTimeline = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await orderService.findById(id);
    if (!order) throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);

    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    const timeline = await orderFulfillmentService.getOrderTimeline(id);

    return sendSuccess(res, timeline, 'Order timeline retrieved');
  } catch (error) {
    next(error);
  }
};

const getOrderNotifications = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await orderService.findById(id);
    if (!order) throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);

    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    const notifications = await orderFulfillmentService.getOrderNotifications(id);

    return sendSuccess(res, notifications, 'Order notifications retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderTracking,
  getOrderStatusHistory,
  getOrderTimeline,
  getOrderNotifications,
};

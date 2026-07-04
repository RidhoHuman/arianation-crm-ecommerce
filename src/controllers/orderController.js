// src/controllers/orderController.js

const orderService = require('../services/orderService');
const knex = require('../config/knex');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { NotFoundError, BadRequestError, AuthorizationError } = require('../utils/errors');
const { MESSAGES } = require('../utils/constants');
const orderFulfillmentService = require('../services/orderFulfillmentService');
const paymentService = require('../services/paymentService');
const { snap } = require('../config/midtrans');

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

    if (req.user?.role === 'CUSTOMER' && order.userId !== null && order.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    // Attach user info if userId exists
    if (order.userId) {
      const user = await knex('user').where('id', order.userId).first();
      if (user) {
        order.user = {
          fullName: user.fullName,
          email: user.email,
          phone: user.phone
        };
      }
    }

    const items = await knex('orderItem')
      .leftJoin('product', 'orderItem.productId', 'product.id')
      .select('orderItem.*', 'product.productName')
      .where('orderId', id);

    order.items = items.map(item => ({
      ...item,
      product: { productName: item.productName }
    }));

    return sendSuccess(res, order, MESSAGES.ORDER_FOUND);
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { paymentMethod, deliveryAddress, notes, items, usePoints, voucherCode } = req.body;

    const user = await knex('user').where('id', userId).first();
    let discountFromPoints = 0;

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

    let finalAmount = totalAmount; // Subtotal
    let tierDiscountAmount = 0;
    let tierDiscountPercentage = 0;

    // 1. Tier Discount
    if (userId) {
      const metrics = await knex('customerMetrics').where('userId', userId).first();
      const currentTier = metrics?.currentTier || 'BRONZE';
      
      if (currentTier === 'SILVER') tierDiscountPercentage = 5;
      else if (currentTier === 'GOLD') tierDiscountPercentage = 10;
      else if (currentTier === 'PLATINUM') tierDiscountPercentage = 15;

      if (tierDiscountPercentage > 0) {
        tierDiscountAmount = Math.floor(totalAmount * (tierDiscountPercentage / 100));
        finalAmount -= tierDiscountAmount;
      }
    }

    // 2. Voucher Discount
    let voucherDiscountAmount = 0;
    let validVoucherCode = null;
    let usedVoucherId = null;

    if (voucherCode) {
      const voucher = await knex('voucher').where('code', voucherCode.toUpperCase()).first();
      if (voucher && voucher.isActive && (!voucher.expiresAt || new Date(voucher.expiresAt) > new Date()) && (!voucher.usageLimit || voucher.usedCount < voucher.usageLimit) && finalAmount >= voucher.minPurchase) {
        if (voucher.type === 'PERCENTAGE') {
          voucherDiscountAmount = Math.floor(finalAmount * (voucher.value / 100));
          if (voucher.maxDiscount > 0 && voucherDiscountAmount > voucher.maxDiscount) {
            voucherDiscountAmount = Number(voucher.maxDiscount);
          }
        } else {
          voucherDiscountAmount = Number(voucher.value);
        }

        if (voucherDiscountAmount > finalAmount) {
          voucherDiscountAmount = finalAmount;
        }

        finalAmount -= voucherDiscountAmount;
        validVoucherCode = voucher.code;
        usedVoucherId = voucher.id;
      } else {
        throw new BadRequestError('Kode voucher tidak valid atau syarat tidak terpenuhi');
      }
    }

    // 3. Points Discount
    let pointsToDeduct = 0;
    if (usePoints && user && user.rewardPoints > 0) {
      discountFromPoints = user.rewardPoints * 1000;
      if (discountFromPoints > finalAmount) {
        pointsToDeduct = Math.ceil(finalAmount / 1000);
      } else {
        pointsToDeduct = user.rewardPoints;
      }
      finalAmount -= (pointsToDeduct * 1000);
    }

    // 4. Floor Limit Safeguard
    if (finalAmount < 0) {
      finalAmount = 0;
    }

    // Buat order dan order items dalam transaksi
    const order = await knex.transaction(async (trx) => {
      const orderId = require('cuid')();

      await trx('order').insert({
        id: orderId,
        orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId,
        totalAmount: finalAmount,
        tierDiscountAmount,
        tierDiscountPercentage,
        voucherCode: validVoucherCode,
        voucherDiscountAmount,
        paymentMethod,
        deliveryAddress: deliveryAddress ? JSON.stringify(deliveryAddress) : null,
        notes: notes || null,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (pointsToDeduct > 0) {
        await trx('user').where('id', userId).decrement('rewardPoints', pointsToDeduct);
        
        // Log to pointHistory
        await trx('pointHistory').insert({
          id: require('cuid')(),
          userId,
          points: pointsToDeduct,
          type: 'SPENT',
          description: `Digunakan untuk pesanan ${orderId.slice(0, 8)}`,
          createdAt: new Date(),
        });
      }

      if (usedVoucherId) {
        await trx('voucher').where('id', usedVoucherId).increment('usedCount', 1);
      }

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

    // Call Midtrans Snap
    let paymentUrl = null;
    let snapToken = null;
    try {
      const customer = user ? {
        first_name: user.fullName?.split(' ')[0] || 'Customer',
        last_name: user.fullName?.split(' ').slice(1).join(' ') || '',
        email: user.email,
        phone: user.phone || '081234567890'
      } : {
        first_name: 'Customer',
        email: deliveryAddress?.email || 'customer@example.com'
      };

      const parameter = {
        transaction_details: {
          order_id: order.id,
          gross_amount: finalAmount
        },
        customer_details: customer,
      };

      const snapResponse = await snap.createTransaction(parameter);
      
      // Save payment locally
      await paymentService.create({
        orderId: order.id,
        amount: finalAmount,
        paymentMethod: paymentMethod || 'MIDTRANS',
        status: 'PENDING',
        transactionId: order.id,
        qrisUrl: snapResponse.redirect_url
      });

      paymentUrl = snapResponse.redirect_url;
      snapToken = snapResponse.token;
    } catch (err) {
      console.error('Midtrans Snap Error:', err.message);
    }

    return sendCreated(res, { ...order, paymentUrl, snapToken }, MESSAGES.ORDER_CREATED);
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

    if (req.user?.role === 'CUSTOMER' && order.userId !== null && order.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    const tracking = await knex('orderTracking').where('orderId', id).first();
    if (tracking) {
      tracking.history = await knex('trackingHistory')
        .where('trackingId', tracking.id)
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

    if (req.user?.role === 'CUSTOMER' && order.userId !== null && order.userId !== req.user.id) {
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

    if (req.user?.role === 'CUSTOMER' && order.userId !== null && order.userId !== req.user.id) {
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

    if (req.user?.role === 'CUSTOMER' && order.userId !== null && order.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    const notifications = await orderFulfillmentService.getOrderNotifications(id);

    return sendSuccess(res, notifications, 'Order notifications retrieved');
  } catch (error) {
    next(error);
  }
};

const createGuestOrder = async (req, res, next) => {
  try {
    const { guestEmail, firstName, lastName, address, city, postalCode, phone, items, paymentMethod, notes } = req.body;

    // Validation: required fields
    if (!guestEmail || !firstName || !lastName || !address || !city || !postalCode || !phone) {
      throw new BadRequestError('All fields (guestEmail, firstName, lastName, address, city, postalCode, phone) are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      throw new BadRequestError('Invalid email format');
    }

    // Sanitize inputs (XSS prevention)
    const sanitizeInput = (str) => {
      if (typeof str !== 'string') return str;
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
    };

    const sanitizedData = {
      guestEmail: sanitizeInput(guestEmail),
      firstName: sanitizeInput(firstName),
      lastName: sanitizeInput(lastName),
      address: sanitizeInput(address),
      city: sanitizeInput(city),
      postalCode: sanitizeInput(postalCode),
      phone: sanitizeInput(phone),
    };

    let orderItems = [];

    // Process cart items if provided
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
          throw new NotFoundError(`Product ${item.productId} not found or inactive`);
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
      throw new BadRequestError('At least one item is required');
    }

    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Create guest order and items in transaction
    const order = await knex.transaction(async (trx) => {
      const orderId = require('cuid')();

      await trx('order').insert({
        id: orderId,
        orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: null,
        deliveryAddress: JSON.stringify({
          fullName: `${sanitizedData.firstName} ${sanitizedData.lastName}`,
          email: sanitizedData.guestEmail,
          phone: sanitizedData.phone,
          addressLine1: sanitizedData.address,
          city: sanitizedData.city,
          postalCode: sanitizedData.postalCode
        }),
        totalAmount,
        paymentMethod: paymentMethod || 'PENDING',
        status: 'PENDING',
        notes: sanitizeInput(notes) || null,
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
      }));

      if (itemRecords.length) {
        await trx('orderItem').insert(itemRecords);
      }

      // Audit log
      await trx('auditLog').insert({
        id: require('cuid')(),
        action: 'GUEST_CHECKOUT_CREATED',
        orderId,
        guestOrderId: orderId,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        createdAt: new Date(),
      });

      return await trx('order').where('id', orderId).first();
    });

    // Call Midtrans Snap
    let paymentUrl = null;
    let snapToken = null;
    try {
      const customer = {
        first_name: sanitizedData.firstName,
        last_name: sanitizedData.lastName,
        email: sanitizedData.guestEmail,
        phone: sanitizedData.phone
      };

      const parameter = {
        transaction_details: {
          order_id: order.id,
          gross_amount: totalAmount
        },
        customer_details: customer,
      };

      const snapResponse = await snap.createTransaction(parameter);
      
      // Save payment locally
      await paymentService.create({
        orderId: order.id,
        amount: totalAmount,
        paymentMethod: paymentMethod || 'MIDTRANS',
        status: 'PENDING',
        transactionId: order.id,
        qrisUrl: snapResponse.redirect_url
      });

      paymentUrl = snapResponse.redirect_url;
      snapToken = snapResponse.token;
    } catch (err) {
      console.error('Midtrans Snap Error:', err.message);
    }

    return sendCreated(res, { orderId: order.id, email: sanitizedData.guestEmail, paymentUrl, snapToken }, 'Guest order created successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  createGuestOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderTracking,
  getOrderStatusHistory,
  getOrderTimeline,
  getOrderNotifications,
};

// src/controllers/orderController.js

const orderService = require('../services/orderService');
const knex = require('../config/knex');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { NotFoundError, BadRequestError, AuthorizationError } = require('../utils/errors');
const { MESSAGES } = require('../utils/constants');
const orderFulfillmentService = require('../services/orderFulfillmentService');
const paymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');
const { Xendit } = require('xendit-node');

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

    if (order.userId !== null) {
      if (!req.user) {
        throw new AuthorizationError('You must be logged in to view this order');
      }
      if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
        throw new AuthorizationError(MESSAGES.FORBIDDEN);
      }
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
    
    // Attach designRequest if this is a Sablon order
    const designRequest = await knex('designRequest').where('orderId', id).first();
    if (designRequest) {
      order.designRequest = designRequest;
    }

    return sendSuccess(res, order, MESSAGES.ORDER_FOUND);
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { paymentMethod, deliveryAddress, notes, items, usePoints, voucherCode, shippingCourier, shippingCost, deliveryType } = req.body;

    let finalShippingCost = shippingCost;
    let finalCourier = shippingCourier;
    let finalDeliveryType = deliveryType || 'SHIPPING';

    if (finalDeliveryType === 'PICKUP') {
      finalShippingCost = 0;
      finalCourier = 'SELF_PICKUP';
    }

    const user = await knex('user').where('id', userId).first();
    let discountFromPoints = 0;

    let orderItems = [];
    let hasSablon = false;
    let hasRetail = false;

    if (items && Array.isArray(items) && items.length > 0) {
      const productIds = [...new Set(items.map((item) => item.productId))];
      const variantIds = [...new Set(items.filter((item) => item.variantId).map((i) => i.variantId))];

      const [products, variants] = await Promise.all([
        knex('product').whereIn('id', productIds),
        knex('productVariant').whereIn('id', variantIds),
      ]);

      const productsById = new Map(products.map((p) => [p.id, p]));
      const variantsById = new Map(variants.map((v) => [v.id, v]));

      // 1. Guardrail: Block Mixed Cart
      hasRetail = products.some(p => p.businessType === 'FASHION_RETAIL');
      hasSablon = products.some(p => p.businessType === 'SABLON_SERVICE');
      
      if (hasRetail && hasSablon) {
        throw new BadRequestError('Pesanan Ready Stock dan Custom Sablon harus dicheckout secara terpisah');
      }

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
      const cartItems = cart ? await knex('cartItem')
        .join('product', 'cartItem.productId', '=', 'product.id')
        .select('cartItem.*', 'product.businessType')
        .where('cartId', cart.id) : [];

      if (!cartItems || cartItems.length === 0) {
        throw new BadRequestError(MESSAGES.CART_EMPTY);
      }

      // 1. Guardrail: Block Mixed Cart (Retail & Sablon together)
      hasRetail = cartItems.some(item => item.businessType === 'FASHION_RETAIL');
      hasSablon = cartItems.some(item => item.businessType === 'SABLON_SERVICE');
      
      if (hasRetail && hasSablon) {
        throw new BadRequestError('Pesanan Ready Stock dan Custom Sablon harus dicheckout secara terpisah');
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

    let pointsToDeduct = 0;
    let usedVoucherId = null;

    // Buat order dan order items dalam transaksi
    const order = await knex.transaction(async (trx) => {
      let finalAmount = totalAmount; // Subtotal
      let tierDiscountAmount = 0;
      let tierDiscountPercentage = 0;

      // 1. Tier Discount
      if (userId) {
        const metrics = await trx('customerMetrics').where('userId', userId).first();
        const currentTier = metrics?.currentTier || 'BRONZE';
        
        if (currentTier === 'SILVER') tierDiscountPercentage = 5;
        else if (currentTier === 'GOLD') tierDiscountPercentage = 10;
        else if (currentTier === 'PLATINUM') tierDiscountPercentage = 15;

        if (tierDiscountPercentage > 0) {
          tierDiscountAmount = Math.floor(totalAmount * (tierDiscountPercentage / 100));
          finalAmount -= tierDiscountAmount;
        }
      }

      // 2. Voucher Discount (WITH ROW LOCKING)
      let voucherDiscountAmount = 0;
      let validVoucherCode = null;

      if (voucherCode) {
        const voucher = await trx('voucher').where('code', voucherCode.toUpperCase()).forUpdate().first();
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
          throw new BadRequestError('Kode voucher tidak valid, kedaluwarsa, atau kuota habis');
        }
      }

      // 3. Points Discount (WITH ROW LOCKING)
      if (usePoints && userId) {
        const lockedUser = await trx('user').where('id', userId).forUpdate().first();
        if (lockedUser && lockedUser.rewardPoints > 0) {
          let discountFromPoints = lockedUser.rewardPoints * 1000;
          if (discountFromPoints > finalAmount) {
            pointsToDeduct = Math.ceil(finalAmount / 1000);
          } else {
            pointsToDeduct = lockedUser.rewardPoints;
          }
          finalAmount -= (pointsToDeduct * 1000);
        }
      }

      // 4. Floor Limit Safeguard
      if (finalAmount < 0) {
        finalAmount = 0;
      }

      // 5. Add Shipping Cost (For Retail)
      if (finalShippingCost && !hasSablon) {
        finalAmount += Number(finalShippingCost);
      }

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
        deliveryType: finalDeliveryType,
        shippingCourier: finalCourier || null,
        shippingCost: finalShippingCost && !hasSablon ? Number(finalShippingCost) : null,
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

    // Always clear the checked-out items from the user's cart
    if (userId) {
      const cart = await knex('shoppingCart').where('userId', userId).first();
      if (cart) {
        await knex('cartItem').where('cartId', cart.id).delete();
      }
    }

    // Queue 'Waiting for Payment' Notification
    try {
      await notificationService.queueNotification({
        orderId: order.id,
        userId: userId || null,
        recipientEmail: user ? user.email : (deliveryAddress?.email || null),
        type: 'PENDING',
        title: 'Menunggu Pembayaran',
        message: `Pesanan ${order.orderNumber} berhasil dibuat. Segera lakukan pembayaran agar pesanan dapat diproses.`,
      });
    } catch (notifErr) {
      console.error('Failed to queue PENDING notification:', notifErr.message);
    }

    // Generate Xendit Invoice
    let paymentUrl = null;
    let snapToken = null; // Kept for compatibility if frontend still destructs it
    try {
      const paymentId = require('cuid')();
      const customerNameParts = user?.fullName ? user.fullName.split(' ') : [];
      const customer = user ? {
        givenNames: customerNameParts[0] || 'Customer',
        ...(customerNameParts.length > 1 && { surname: customerNameParts.slice(1).join(' ') }),
        email: user.email,
        mobileNumber: user.phone || '081234567890'
      } : {
        givenNames: 'Customer',
        email: deliveryAddress?.email || 'customer@example.com'
      };

      const xenditClient = new Xendit({ secretKey: process.env.XENDIT_API_KEY });
      const invoiceRequest = {
        externalId: paymentId,
        amount: finalAmount,
        payerEmail: customer.email,
        description: `Pesanan AriaNation #${order.orderNumber || order.id}`,
        customer: customer,
        successRedirectUrl: `${process.env.FRONTEND_URL}/order-tracking/${order.id}`,
        failureRedirectUrl: `${process.env.FRONTEND_URL}/checkout`
      };

      const xenditResponse = await xenditClient.Invoice.createInvoice({ data: invoiceRequest });
      paymentUrl = xenditResponse.invoiceUrl;
      
      // Save payment locally
      await paymentService.create({
        id: paymentId,
        orderId: order.id,
        amount: finalAmount,
        paymentMethod: paymentMethod || 'XENDIT',
        status: 'PENDING',
        transactionId: order.id,
        qrisUrl: paymentUrl,
        xenditId: xenditResponse.id
      });
    } catch (err) {
      console.error('Xendit Invoice Error Details:', err.response ? JSON.stringify(err.response, null, 2) : err.message);
      console.error('Xendit Request Data:', JSON.stringify(invoiceRequest, null, 2));

      // 2. Guardrail: Manual Rollback for State Locking if Xendit fails
      await knex('order').where('id', order.id).update({ status: 'FAILED' });
      
      if (pointsToDeduct > 0) {
        await knex('user').where('id', userId).increment('rewardPoints', pointsToDeduct);
        
        await knex('pointHistory').insert({
          id: require('cuid')(),
          userId,
          points: pointsToDeduct,
          type: 'REFUNDED',
          description: `Pengembalian poin karena tagihan gagal (Pesanan ${order.id.slice(0, 8)})`,
          createdAt: new Date(),
        });
      }
      
      if (usedVoucherId) {
        await knex('voucher').where('id', usedVoucherId).decrement('usedCount', 1);
      }
      
      throw new BadRequestError('Gagal membuat tagihan pembayaran. Saldo poin dan voucher Anda telah dikembalikan otomatis.');
    }

    // Admin Notification
    try {
      await knex('admin_notifications').insert({
        title: 'Pesanan Retail Baru!',
        message: `Pesanan Retail #${order.orderNumber} baru saja dibuat senilai Rp ${finalAmount}.`,
        type: 'NEW_ORDER',
        isRead: false
      });
    } catch (err) {
      console.error('Failed to create Admin notification for Retail:', err.message);
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

    if (order.userId !== null) {
      if (!req.user) {
        throw new AuthorizationError('You must be logged in to view this tracking information');
      }
      if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
        throw new AuthorizationError(MESSAGES.FORBIDDEN);
      }
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

    if (order.userId !== null) {
      if (!req.user) {
        throw new AuthorizationError('You must be logged in to view this order history');
      }
      if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
        throw new AuthorizationError(MESSAGES.FORBIDDEN);
      }
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

    if (order.userId !== null) {
      if (!req.user) {
        throw new AuthorizationError('You must be logged in to view this order timeline');
      }
      if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
        throw new AuthorizationError(MESSAGES.FORBIDDEN);
      }
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

    if (order.userId !== null) {
      if (!req.user) {
        throw new AuthorizationError('You must be logged in to view order notifications');
      }
      if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
        throw new AuthorizationError(MESSAGES.FORBIDDEN);
      }
    }

    const notifications = await orderFulfillmentService.getOrderNotifications(id);

    return sendSuccess(res, notifications, 'Order notifications retrieved');
  } catch (error) {
    next(error);
  }
};

const createGuestOrder = async (req, res, next) => {
  try {
    const { guestEmail, firstName, lastName, address, city, postalCode, phone, items, paymentMethod, notes, shippingCourier, shippingCost } = req.body;

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

      // 1. Guardrail: Block Mixed Cart
      const hasRetail = products.some(p => p.businessType === 'FASHION_RETAIL');
      const hasSablon = products.some(p => p.businessType === 'SABLON_SERVICE');
      
      if (hasRetail && hasSablon) {
        throw new BadRequestError('Pesanan Ready Stock dan Custom Sablon harus dicheckout secara terpisah');
      }

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

    let finalAmount = totalAmount;
    if (shippingCost && !hasSablon) {
      finalAmount += Number(shippingCost);
    }

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
        totalAmount: finalAmount,
        paymentMethod: paymentMethod || 'PENDING',
        shippingCourier: shippingCourier || null,
        shippingCost: shippingCost && !hasSablon ? Number(shippingCost) : null,
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

    // Generate Xendit Invoice
    let paymentUrl = null;
    let snapToken = null;
    try {
      const paymentId = require('cuid')();
      const customer = {
        givenNames: sanitizedData.firstName,
        surname: sanitizedData.lastName,
        email: sanitizedData.guestEmail,
        mobileNumber: sanitizedData.phone
      };

      const xenditClient = new Xendit({ secretKey: process.env.XENDIT_API_KEY });
      const invoiceRequest = {
        externalId: paymentId,
        amount: finalAmount,
        payerEmail: customer.email,
        description: `Pesanan Guest AriaNation #${order.orderNumber || order.id}`,
        customer: customer,
        successRedirectUrl: `${process.env.FRONTEND_URL}/order-tracking/${order.id}`,
        failureRedirectUrl: `${process.env.FRONTEND_URL}/checkout`
      };

      const xenditResponse = await xenditClient.Invoice.createInvoice({ data: invoiceRequest });
      paymentUrl = xenditResponse.invoiceUrl;
      
      // Save payment locally
      await paymentService.create({
        id: paymentId,
        orderId: order.id,
        amount: finalAmount,
        paymentMethod: paymentMethod || 'XENDIT',
        status: 'PENDING',
        transactionId: order.id,
        qrisUrl: paymentUrl,
        xenditId: xenditResponse.id
      });
    } catch (err) {
      console.error('Xendit Invoice Error:', err.message);
      
      // 2. Guardrail: Manual Rollback for State Locking if Xendit fails
      await knex('order').where('id', order.id).update({ status: 'FAILED' });
      
      throw new BadRequestError('Gagal membuat tagihan pembayaran. Silakan coba lagi.');
    }

    // Admin Notification (Guest)
    try {
      await knex('admin_notifications').insert({
        title: 'Pesanan Guest Baru!',
        message: `Pesanan Retail Guest #${order.orderNumber} baru saja dibuat senilai Rp ${finalAmount}.`,
        type: 'NEW_ORDER',
        isRead: false
      });
    } catch (err) {
      console.error('Failed to create Admin notification for Guest Retail:', err.message);
    }

    return sendCreated(res, { orderId: order.id, email: sanitizedData.guestEmail, paymentUrl, snapToken }, 'Guest order created successfully');
  } catch (error) {
    next(error);
  }
};

const getShippingRates = async (req, res, next) => {
  try {
    const { destinationPostalCode, items, weight } = req.body;
    
    if (!destinationPostalCode) {
      throw new BadRequestError('Kode pos tujuan wajib diisi');
    }

    let totalWeight = weight ? Number(weight) : 0;
    
    if (totalWeight === 0 && items && Array.isArray(items) && items.length > 0) {
      const productIds = items.map(i => i.productId);
      const products = await knex('product').whereIn('id', productIds).select('id', 'weight');
      const productsById = new Map(products.map(p => [p.id, p]));
      
      for (const item of items) {
        const p = productsById.get(item.productId);
        if (p) {
          totalWeight += (p.weight || 250) * item.quantity;
        }
      }
    }
    
    if (totalWeight === 0) totalWeight = 250; 

    const shippingService = require('../services/shippingService');
    const rates = await shippingService.getRates({
      destinationPostalCode,
      weight: totalWeight
    });

    return sendSuccess(res, rates, 'Tarif pengiriman berhasil diambil');
  } catch (error) {
    next(error);
  }
};

const createPelunasanInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { shippingCourier, shippingCost, deliveryAddress, deliveryType } = req.body;

    const order = await orderService.findById(id);
    if (!order) throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);

    if (order.status !== 'WAITING_FINAL_PAYMENT') {
      throw new BadRequestError('Pesanan belum siap untuk pelunasan');
    }

    let finalShippingCost = shippingCost;
    let finalCourier = shippingCourier;
    let finalDeliveryType = deliveryType || 'SHIPPING';

    if (finalDeliveryType === 'PICKUP') {
      finalShippingCost = 0;
      finalCourier = 'SELF_PICKUP';
    }

    if (!finalCourier || finalShippingCost === undefined) {
      throw new BadRequestError('Opsi pengiriman harus dipilih');
    }

    const payments = await knex('payment').where('orderId', id).where('status', 'COMPLETED');
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    let baseAmount = order.totalAmount;
    const designRequest = await knex('designRequest').where('orderId', id).first();
    if (designRequest && designRequest.estimatedPrice) {
      baseAmount = designRequest.estimatedPrice;
    }
    
    const remainingToPay = baseAmount - totalPaid + Number(finalShippingCost);

    await knex('order').where('id', id).update({
      shippingCourier: finalCourier,
      shippingCost: Number(finalShippingCost),
      deliveryType: finalDeliveryType,
      totalAmount: baseAmount,
      ...(deliveryAddress && { deliveryAddress: JSON.stringify(deliveryAddress) }),
      updatedAt: new Date()
    });

    if (remainingToPay <= 0) {
      await orderFulfillmentService.updateOrderStatus(
        id,
        'READY_TO_SHIP',
        req.user?.id || 'SYSTEM',
        'Pesanan lunas 100% dan metode pickup dipilih, loncat langsung ke siap diambil.'
      );
      return sendSuccess(res, { paymentUrl: null, skipped: true }, 'Tidak ada biaya tambahan, pesanan siap diambil.');
    }

    const paymentId = require('cuid')();
    
    let customer = { givenNames: 'Customer', email: 'customer@example.com' };
    if (order.userId) {
      const user = await knex('user').where('id', order.userId).first();
      if (user) {
        customer = {
          givenNames: user.fullName || 'Customer',
          email: user.email,
          mobileNumber: user.phone || '081234567890'
        };
      }
    } else {
      try {
        const addr = JSON.parse(order.deliveryAddress);
        customer = {
          givenNames: addr.fullName || 'Customer',
          email: addr.email || 'customer@example.com',
          mobileNumber: addr.phone || '081234567890'
        };
      } catch (e) {}
    }

    const xenditClient = new Xendit({ secretKey: process.env.XENDIT_API_KEY });
    const invoiceRequest = {
      externalId: paymentId,
      amount: remainingToPay,
      payerEmail: customer.email,
      description: `Pelunasan & Ongkir AriaNation #${order.orderNumber || order.id}`,
      customer: customer,
      successRedirectUrl: `${process.env.FRONTEND_URL}/order-tracking/${order.id}`,
      failureRedirectUrl: `${process.env.FRONTEND_URL}/checkout-pelunasan/${order.id}`
    };

    const xenditResponse = await xenditClient.Invoice.createInvoice({ data: invoiceRequest });
    
    await paymentService.create({
      id: paymentId,
      orderId: order.id,
      amount: remainingToPay,
      paymentMethod: 'XENDIT',
      status: 'PENDING',
      transactionId: order.id,
      qrisUrl: xenditResponse.invoiceUrl,
      xenditId: xenditResponse.id
    });

    return sendSuccess(res, { paymentUrl: xenditResponse.invoiceUrl }, 'Invoice pelunasan berhasil dibuat');
  } catch (error) {
    next(error);
  }
};

const requestRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string') {
      throw new BadRequestError('Alasan pembatalan dan refund wajib diisi');
    }

    const order = await knex('order').where('id', id).first();
    if (!order) {
      throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);
    }

    // Hanya pemilik order yang bisa minta refund
    if (order.userId !== req.user.id) {
      throw new AuthorizationError('Tidak memiliki akses ke pesanan ini');
    }

    // Gatekeeping: Hanya saat CONFIRMED
    if (order.status !== 'CONFIRMED') {
      return res.status(403).json({
        success: false,
        message: 'Pembatalan sepihak dan refund hanya bisa diajukan saat pesanan berstatus CONFIRMED.'
      });
    }

    // Update status ke REFUND_REQUESTED
    const updatedOrder = await orderFulfillmentService.updateOrderStatus(
      id,
      'REFUND_REQUESTED',
      req.user.id,
      'Refund diajukan kustomer',
      reason
    );

    // Kirim notifikasi lonceng ke Admin
    await notificationService.createAdminNotification({
      type: 'ORDER_ISSUE',
      title: 'Permintaan Refund Kustomer',
      message: `Kustomer mengajukan refund untuk pesanan ${order.orderNumber}. Alasan: ${reason}`,
      referenceId: order.id,
      referenceType: 'ORDER'
    });

    return sendSuccess(res, updatedOrder, 'Permintaan refund berhasil diajukan');
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
  getShippingRates,
  createPelunasanInvoice,
  requestRefund,
};

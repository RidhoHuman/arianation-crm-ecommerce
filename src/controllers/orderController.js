// src/controllers/orderController.js

const orderService = require('../services/orderService');
const knex = require('../config/knex');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { NotFoundError, BadRequestError, AuthorizationError, AuthenticationError } = require('../utils/errors');
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

    const isCustomer = ['CUSTOMER'].includes(req.user.role);
    const filterUserId = isCustomer ? req.user.id : userId;

    let excludeStatus = [];
    if (!isCustomer && !status) {
      excludeStatus = ['PENDING'];
    }

    const [orders, total] = await Promise.all([
      orderService.findMany({ page, limit, userId: filterUserId, status, excludeStatus }),
      orderService.count({ userId: filterUserId, status, excludeStatus }),
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
        throw new AuthenticationError('You must be logged in to view this order');
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
      .leftJoin('productVariant as v', 'orderItem.variantId', 'v.id')
      .select(
        'orderItem.*', 
        'product.productName',
        'product.imageUrl as productImage',
        knex.raw('v.variantName as size, v.color as color, v.imageUrl as variantImage')
      )
      .where('orderId', id);

    order.items = items.map(item => ({
      ...item,
      product: { productName: item.productName }
    }));
    
    // Attach designRequests if this is a Sablon order
    const designRequests = await knex('designRequest').where('orderId', id);
    if (designRequests && designRequests.length > 0) {
      order.designRequests = designRequests;
    }

    // Attach payments and totalPaid
    const payments = await knex('payment').where('orderId', id).orderBy('createdAt', 'desc');
    order.payments = payments;
    order.totalPaid = payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0);

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
        
        const tierSettings = await trx('store_settings')
          .whereIn('settingKey', ['tier_silver_discount', 'tier_gold_discount', 'tier_platinum_discount']);
          
        const getTierDiscount = (key, defaultDisc) => {
          const setting = tierSettings.find(s => s.settingKey === key);
          return setting && !isNaN(Number(setting.settingValue)) ? Number(setting.settingValue) : defaultDisc;
        };
        
        if (currentTier === 'SILVER') tierDiscountPercentage = getTierDiscount('tier_silver_discount', 5);
        else if (currentTier === 'GOLD') tierDiscountPercentage = getTierDiscount('tier_gold_discount', 10);
        else if (currentTier === 'PLATINUM') tierDiscountPercentage = getTierDiscount('tier_platinum_discount', 15);

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

      // 3. Points Discount (WITH ROW LOCKING & SAFETY NET)
      if (usePoints && userId) {
        const lockedUser = await trx('user').where('id', userId).forUpdate().first();
        if (lockedUser && lockedUser.rewardPoints > 0) {
          // Fetch settings dynamically within transaction
          const exchangeRateSetting = await trx('store_settings').where('settingKey', 'points_exchange_rate').first();
          const maxDiscountSetting = await trx('store_settings').where('settingKey', 'max_points_discount_percentage').first();
          
          const exchangeRate = exchangeRateSetting && !isNaN(Number(exchangeRateSetting.settingValue)) ? Number(exchangeRateSetting.settingValue) : 10;
          const maxPercent = maxDiscountSetting && !isNaN(Number(maxDiscountSetting.settingValue)) ? Number(maxDiscountSetting.settingValue) : 50;

          const maxAllowedDiscount = (finalAmount * maxPercent) / 100;
          
          // Total capacity of points to money
          const totalPointsValue = lockedUser.rewardPoints * exchangeRate;
          
          let discountFromPoints = 0;
          if (totalPointsValue > maxAllowedDiscount) {
            // Point value exceeds max allowed limit
            discountFromPoints = maxAllowedDiscount;
            pointsToDeduct = Math.ceil(maxAllowedDiscount / exchangeRate);
          } else if (totalPointsValue > finalAmount) {
            // Point value exceeds order total (should not happen if maxPercent <= 100, but as a fallback)
            discountFromPoints = finalAmount;
            pointsToDeduct = Math.ceil(finalAmount / exchangeRate);
          } else {
            // Consume all points
            discountFromPoints = totalPointsValue;
            pointsToDeduct = lockedUser.rewardPoints;
          }
          
          finalAmount -= (pointsToDeduct * exchangeRate);
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

    // Generate Xendit Invoice
    let paymentUrl = null;
    let snapToken = null; // Kept for compatibility if frontend still destructs it
    let invoiceRequest;
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
      invoiceRequest = {
        externalId: paymentId,
        amount: order.totalAmount,
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
        amount: order.totalAmount,
        paymentMethod: paymentMethod || 'XENDIT',
        status: 'PENDING',
        transactionId: order.id,
        qrisUrl: paymentUrl,
        xenditId: xenditResponse.id
      });

      // Always clear the checked-out items from the user's cart now that Xendit succeeded
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
      
      const xenditErrorDetail = err.response && err.response.message ? err.response.message : err.message;
      let errorMsg = `Gagal membuat tagihan pembayaran dari pihak payment gateway (Xendit): ${xenditErrorDetail}`;
      if (pointsToDeduct > 0 || usedVoucherId) {
        errorMsg += ' Saldo poin dan voucher Anda telah dikembalikan otomatis.';
      }
      throw new BadRequestError(errorMsg);
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
    let hasSablon = false;
    let hasRetail = false;

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
      hasRetail = products.some(p => p.businessType === 'FASHION_RETAIL');
      hasSablon = products.some(p => p.businessType === 'SABLON_SERVICE');
      
      if (hasRetail && hasSablon) {
        throw new BadRequestError('Pesanan Ready Stock dan Custom Sablon harus dicheckout secara terpisah');
      }

      if (hasSablon) {
        throw new BadRequestError('Mohon maaf, khusus pemesanan Custom Sablon Anda diwajibkan untuk mendaftar dan Login ke akun terlebih dahulu demi kemudahan pelacakan desain.');
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

    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
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
      const productIds = items.map(i => i.productId).filter(Boolean);
      const productNames = items.map(i => i.productName).filter(Boolean);
      
      let productsQuery = knex('product')
        .leftJoin('productCategory', 'product.categoryId', 'productCategory.id')
        .select('product.id', 'product.productName', 'product.weight_gram', 'productCategory.categoryName');
        
      if (productIds.length > 0 && productNames.length > 0) {
        productsQuery = productsQuery.where(function() {
          this.whereIn('product.id', productIds).orWhereIn('product.productName', productNames);
        });
      } else if (productIds.length > 0) {
        productsQuery = productsQuery.whereIn('product.id', productIds);
      } else if (productNames.length > 0) {
        productsQuery = productsQuery.whereIn('product.productName', productNames);
      } else {
        productsQuery = productsQuery.whereRaw('1=0'); // Don't query anything
      }
      
      const products = await productsQuery;
      
      const productsById = new Map();
      const productsByName = new Map();
      products.forEach(p => {
        if (p.id) productsById.set(p.id, p);
        if (p.productName) productsByName.set(p.productName, p);
      });
      
      let totalQty = 0;
      for (const item of items) {
        totalQty += item.quantity || 1;
        const p = productsById.get(item.productId) || productsByName.get(item.productName);
        if (p) {
          let fallbackWeight = 250;
          if (p.categoryName) {
            const catName = p.categoryName.toLowerCase();
            if (catName.includes('topi')) {
              fallbackWeight = 100;
            } else if (catName.includes('tas') || catName.includes('spunbond') || catName.includes('tote') || catName.includes('goodie')) {
              fallbackWeight = 150;
            } else if (catName.includes('lanyard') || catName.includes('id card')) {
              fallbackWeight = 50;
            } else if (catName.includes('jaket') || catName.includes('hoodie') || catName.includes('sweater')) {
              fallbackWeight = 500;
            }
          }
          totalWeight += (p.weight_gram || fallbackWeight) * item.quantity;
        } else {
          // If productId not found (e.g., custom sablon manual), attempt to guess from productName string
          let fallbackWeight = 250;
          if (item.productName) {
             const nameStr = item.productName.toLowerCase();
             if (nameStr.includes('topi')) fallbackWeight = 100;
             else if (nameStr.includes('tas') || nameStr.includes('spunbond') || nameStr.includes('tote') || nameStr.includes('goodie')) fallbackWeight = 150;
             else if (nameStr.includes('lanyard') || nameStr.includes('id card')) fallbackWeight = 50;
             else if (nameStr.includes('jaket') || nameStr.includes('hoodie') || nameStr.includes('sweater')) fallbackWeight = 500;
          }
          totalWeight += fallbackWeight * item.quantity;
        }
      }
      
      // Logika Buffer Dinamis (Sprint 1)
      const packagingBuffer = totalQty < 3 ? 50 : 250; // Polymailer 50g, Kardus 250g
      totalWeight += packagingBuffer;
    }
    
    // Fallback if no items and no weight provided
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

    let finalShippingCost = shippingCost !== undefined ? shippingCost : order.shippingCost;
    let finalCourier = shippingCourier || order.shippingCourier;
    let finalDeliveryType = deliveryType || order.deliveryType || 'SHIPPING';

    if (finalDeliveryType === 'PICKUP') {
      finalShippingCost = 0;
      finalCourier = 'SELF_PICKUP';
    }

    if (!finalCourier || finalShippingCost === undefined || finalShippingCost === null) {
      throw new BadRequestError('Opsi pengiriman harus dipilih');
    }

    const payments = await knex('payment').where('orderId', id).where('status', 'COMPLETED');
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        let baseAmount = Number(order.totalPrice || order.totalAmount || 0);
      const designRequest = await knex('designRequest').where('orderId', id).first();
      if (designRequest && designRequest.estimatedPrice) {
        // baseAmount = designRequest.estimatedPrice; // REMOVED: baseAmount should be the total order price, not a single design's price
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
      transactionId: paymentId,
      qrisUrl: xenditResponse.invoiceUrl,
      xenditId: xenditResponse.id,
      paymentType: 'FULL'
    });

    return sendSuccess(res, { paymentUrl: xenditResponse.invoiceUrl }, 'Invoice pelunasan berhasil dibuat');
  } catch (error) {
    next(error);
  }
};

const requestRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, bankName, accountNumber, accountName } = req.body;

    if (!reason || typeof reason !== 'string') {
      throw new BadRequestError('Alasan pembatalan dan refund wajib diisi');
    }

    if (!bankName || !accountNumber || !accountName) {
      throw new BadRequestError('Detail rekening bank wajib diisi untuk proses refund');
    }

    const order = await knex('order').where('id', id).first();
    if (!order) {
      throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);
    }

    // Hanya pemilik order yang bisa minta refund. Untuk Guest (userId = null), semua yang memiliki akses ke URL ini (Magic Link) diperbolehkan.
    if (order.userId) {
      if (!req.user || order.userId !== req.user.id) {
        throw new AuthorizationError('Tidak memiliki akses ke pesanan ini');
      }
    }

    // Gatekeeping: Hanya saat CONFIRMED atau PAID_WAITING_APPROVAL
    if (order.status !== 'CONFIRMED' && order.status !== 'PAID_WAITING_APPROVAL') {
      return res.status(403).json({
        success: false,
        message: 'Pembatalan sepihak dan refund hanya bisa diajukan saat pesanan belum diproses (berstatus CONFIRMED atau PAID_WAITING_APPROVAL).'
      });
    }

    // Simpan data rekening bank ke dalam format JSON di kolom refundDetails
    const refundDetailsJSON = JSON.stringify({
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim()
    });

    await knex('order')
      .where('id', id)
      .update({ refundDetails: refundDetailsJSON });

    // Tentukan pelapor status
    const requestedBy = req.user ? req.user.id : 'GUEST_USER';

    // Update status ke REFUND_REQUESTED
    const updatedOrder = await orderFulfillmentService.updateOrderStatus(
      id,
      'REFUND_REQUESTED',
      requestedBy,
      'Refund diajukan kustomer',
      reason
    );

    // Kirim notifikasi lonceng ke Admin
    try {
      await knex('admin_notifications').insert({
        title: 'Permintaan Refund Diterima',
        message: `Kustomer mengajukan refund untuk pesanan #${order.orderNumber}. Alasan: ${reason}`,
        type: 'ORDER_ISSUE',
        isRead: false
      });
    } catch (err) {
      console.error('Failed to create Admin notification for Refund:', err.message);
    }

    return sendSuccess(res, updatedOrder, 'Permintaan refund berhasil diajukan');
  } catch (error) {
    next(error);
  }
};

const completeOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await orderService.findById(id);
    if (!order) throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);

    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    const validStatuses = ['SHIPPED', 'DELIVERED', 'READY_FOR_DELIVERY'];
    if (!validStatuses.includes(order.status)) {
      throw new BadRequestError('Only shipped or delivered orders can be marked as COMPLETED.');
    }

    const updatedOrder = await orderFulfillmentService.updateOrderStatus(
      id,
      'COMPLETED',
      req.user.id,
      'Pelanggan telah menerima pesanan dan menyelesaikannya',
      req.body?.notes || 'Pesanan Diterima'
    );

    return sendSuccess(res, updatedOrder, 'Pesanan berhasil diselesaikan. Poin Anda telah ditambahkan!');
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
  completeOrder,
};

// triggered restart

// Trigger nodemon restart after env change


// src/controllers/adminController.js

const knex = require('../config/knex');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { NotFoundError, ValidationError, BadRequestError } = require('../utils/errors');
const orderFulfillmentService = require('../services/orderFulfillmentService');
const productService = require('../services/productService');
const orderService = require('../services/orderService');
const userService = require('../services/userService');
const designRequestService = require('../services/designRequestService');
const paymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');

// ============================================================
// DASHBOARD
// ============================================================

const getDashboard = async (req, res, next) => {
  try {
    const daysParam = parseInt(req.query.days, 10) || 7;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todayOrders,
      monthOrders,
      allOrders,
      totalCustomers,
      pendingDesigns,
      totalRevenue,
      topProducts,
      recentOrders,
    ] = await Promise.all([
      knex('order').where('createdAt', '>=', todayStart).count('* as count').first().then(r => r?.count || 0),
      knex('order').where('createdAt', '>=', monthStart).count('* as count').first().then(r => r?.count || 0),
      knex('order').count('* as count').first().then(r => r?.count || 0),
      knex('user').where('role', 'CUSTOMER').count('* as count').first().then(r => r?.count || 0),
      knex('designRequest').where('status', 'SUBMITTED').count('* as count').first().then(r => r?.count || 0),
      knex('order')
        .where('status', 'in', ['CONFIRMED', 'DELIVERED'])
        .sum('totalAmount as totalAmount')
        .first()
        .then(r => r?.totalAmount || 0),
      knex('orderItem')
        .select('productId')
        .count('id as count')
        .sum('subtotal as revenue')
        .groupBy('productId')
        .orderBy('count', 'desc')
        .limit(5),
      knex('order')
        .select('id', 'orderNumber', 'totalAmount', 'status', 'createdAt')
        .orderBy('createdAt', 'desc')
        .limit(10),
    ]);

    // Get product names for top products
    const topProductDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await knex('product')
          .select('productName')
          .where('id', item.productId)
          .first();
        return {
          productId: item.productId,
          productName: product?.productName,
          count: item.count,
          revenue: item.revenue,
        };
      })
    );

    // Get item counts for recent orders
    const recentOrdersWithItems = await Promise.all(
      recentOrders.map(async (order) => {
        const itemCount = await knex('orderItem')
          .where('orderId', order.id)
          .count('* as count')
          .first()
          .then(r => r?.count || 0);
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
          itemCount,
          createdAt: order.createdAt,
        };
      })
    );

    // Calculate dynamic days revenue
    const daysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (daysParam - 1));
    const chartOrders = await knex('order')
      .select('createdAt', 'totalAmount')
      .where('createdAt', '>=', daysAgo)
      .andWhereNot('status', 'in', ['CANCELLED', 'RETURNED']);

    const revenueChart = Array(daysParam).fill(0).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((daysParam - 1) - i));
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const sum = chartOrders.reduce((acc, order) => {
        const od = new Date(order.createdAt);
        const o_yyyy = od.getFullYear();
        const o_mm = String(od.getMonth() + 1).padStart(2, '0');
        const o_dd = String(od.getDate()).padStart(2, '0');
        const o_dateStr = `${o_yyyy}-${o_mm}-${o_dd}`;

        if (o_dateStr === dateStr) {
          return acc + Number(order.totalAmount || 0);
        }
        return acc;
      }, 0);
      
      let label = `H-${(daysParam - 1) - i}`;
      if (i === (daysParam - 1)) label = 'H-0';
      if (daysParam > 14) {
        // Just show date for long ranges
        label = `${dd}/${mm}`;
      }
      
      return { date: dateStr, total: sum, label };
    });

    const dashboard = {
      orders: {
        today: todayOrders,
        month: monthOrders,
        total: allOrders,
      },
      revenue: {
        total: totalRevenue,
        currency: 'IDR',
      },
      customers: {
        total: totalCustomers,
      },
      designs: {
        pending: pendingDesigns,
      },
      revenueChart,
      topProducts: topProductDetails,
      recentOrders: recentOrdersWithItems,
    };

    return sendSuccess(res, dashboard, 'Dashboard data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PRODUCT MANAGEMENT
// ============================================================

const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, categoryId, businessType } = req.query;

    // Build filter object for service
    const filters = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };
    if (search) filters.search = search;
    if (categoryId) filters.category = categoryId;
    if (businessType) filters.businessType = businessType;

    const [products, total] = await Promise.all([
      productService.findMany(filters),
      productService.count(filters),
    ]);

    return sendPaginated(
      res,
      products,
      {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
      'Products retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const {
      categoryId,
      productName,
      description,
      descriptionEn,
      price,
      stockQuantity,
      productType,
      imageUrl,
      imageUrls,
      businessType,
      variants,
      productTypeId,
      allowedPrintAreas,
      weight_gram,
    } = req.body;

    if (!categoryId || !productName || !price || !productType || !businessType) {
      throw new ValidationError(
        'Missing required fields: categoryId, productName, price, productType, businessType'
      );
    }

    let finalImageUrl = imageUrl || null;
    if (req.file) {
      finalImageUrl = req.file.url || `/uploads/products/${req.file.filename}`;
    }

    const product = await productService.create({
      categoryId,
      productName,
      description: description || null,
      descriptionEn: descriptionEn || null,
      price: parseFloat(price),
      stockQuantity: parseInt(stockQuantity, 10) || 0,
      productType,
      imageUrl: finalImageUrl,
      imageUrls: imageUrls ? (typeof imageUrls === 'string' ? JSON.parse(imageUrls) : imageUrls) : null,
      businessType,
      productTypeId: productTypeId === '' ? null : productTypeId,
      tags: req.body.tags || null,
      isSale: req.body.isSale === 'true' || req.body.isSale === true || req.body.isSale === '1' || req.body.isSale === 1,
      isActive: req.body.isActive === undefined ? true : (req.body.isActive === 'true' || req.body.isActive === true || req.body.isActive === '1' || req.body.isActive === 1),
      variants: variants ? (typeof variants === 'string' ? JSON.parse(variants) : variants) : [],
      allowedPrintAreas: allowedPrintAreas ? (typeof allowedPrintAreas === 'string' ? JSON.parse(allowedPrintAreas) : allowedPrintAreas) : null,
      weight_gram: weight_gram === '' || weight_gram === undefined ? null : parseInt(weight_gram, 10),
    });

    let colIds = req.body.collectionIds;
    if (colIds !== undefined) {
      if (!Array.isArray(colIds)) colIds = [colIds];
      if (colIds.length > 0) {
        const colRecords = colIds.map(cId => ({ productId: product.id, collectionId: cId }));
        await knex('product_collection').insert(colRecords);
      }
    }

    // Audit log
    await knex('auditLog')
      .insert({
        id: require('cuid')(),
        userId: req.user.id,
        action: 'PRODUCT_CREATED',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .catch(() => {});

    return sendCreated(res, product, 'Product created successfully');
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productName, description, descriptionEn, price, stockQuantity, productType, imageUrl, imageUrls, isActive, variants, categoryId, productTypeId, allowedPrintAreas, weight_gram } =
      req.body;

    const product = await productService.findById(id);
    if (!product) throw new NotFoundError('Product not found');

    let finalImageUrl = imageUrl;
    if (req.file) {
      finalImageUrl = req.file.url || `/uploads/products/${req.file.filename}`;
    }

    const updated = await productService.update(id, {
      ...(productName && { productName }),
      ...(description !== undefined && { description }),
      ...(descriptionEn !== undefined && { descriptionEn }),
      ...(price && { price: parseFloat(price) }),
      ...(stockQuantity !== undefined && { stockQuantity: parseInt(stockQuantity, 10) }),
      ...(productType && { productType }),
      ...(finalImageUrl !== undefined && { imageUrl: finalImageUrl }),
      ...(imageUrls !== undefined && { imageUrls: imageUrls ? (typeof imageUrls === 'string' ? JSON.parse(imageUrls) : imageUrls) : null }),
      ...(isActive !== undefined && { isActive: isActive === 'true' || isActive === true || isActive === '1' || isActive === 1 }),
      ...(req.body.isSale !== undefined && { isSale: req.body.isSale === 'true' || req.body.isSale === true || req.body.isSale === '1' || req.body.isSale === 1 }),
      ...(req.body.businessType && { businessType: req.body.businessType }),
      ...(req.body.tags !== undefined && { tags: req.body.tags }),
      ...(variants !== undefined && { variants: typeof variants === 'string' ? JSON.parse(variants) : variants }),
      ...(categoryId !== undefined && { categoryId }),
      ...(productTypeId !== undefined && { productTypeId: productTypeId === '' ? null : productTypeId }),
      ...(allowedPrintAreas !== undefined && { allowedPrintAreas: typeof allowedPrintAreas === 'string' ? JSON.parse(allowedPrintAreas) : allowedPrintAreas }),
      ...(weight_gram !== undefined && { weight_gram: weight_gram === '' ? null : parseInt(weight_gram, 10) }),
    });

    // Save collectionIds jika ada
    let colIds = req.body.collectionIds;
    if (colIds !== undefined) {
      if (!Array.isArray(colIds)) colIds = [colIds];
      await knex('product_collection').where('productId', id).del();
      if (colIds.length > 0) {
        const colRecords = colIds.map(cId => ({ productId: id, collectionId: cId }));
        await knex('product_collection').insert(colRecords);
      }
    }

    // Audit log
    await knex('auditLog')
      .insert({
        id: require('cuid')(),
        userId: req.user.id,
        action: 'PRODUCT_UPDATED',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .catch(() => {});

    return sendSuccess(res, updated, 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await productService.findById(id);
    if (!product) throw new NotFoundError('Product not found');

    await productService.delete(id);

    // Audit log
    await knex('auditLog')
      .insert({
        id: require('cuid')(),
        userId: req.user.id,
        action: 'PRODUCT_DELETED',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .catch(() => {});

    return sendSuccess(res, null, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ORDER MANAGEMENT
// ============================================================

const getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search, dateFrom, dateTo } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let query = knex('order');
    
    if (status) {
      query = query.where('status', status);
    }
    if (search) {
      query = query.where('orderNumber', 'like', `%${search}%`);
    }
    if (dateFrom || dateTo) {
      if (dateFrom) query = query.where('createdAt', '>=', new Date(dateFrom));
      if (dateTo) query = query.where('createdAt', '<=', new Date(dateTo));
    }

    const [orders, countResult] = await Promise.all([
      query
        .select(
          'order.id', 
          'order.orderNumber', 
          'order.totalAmount', 
          'order.status', 
          'order.createdAt',
          'order.userId',
          'user.fullName as customerName',
          'user.email as customerEmail'
        )
        .leftJoin('user', 'order.userId', 'user.id')
        .orderBy('order.createdAt', 'desc')
        .limit(parseInt(limit, 10))
        .offset(skip),
      knex('order')
        .count('* as count')
        .modify((builder) => {
          if (status) builder.where('status', status);
          if (search) builder.where('orderNumber', 'like', `%${search}%`);
          if (dateFrom || dateTo) {
            if (dateFrom) builder.where('createdAt', '>=', new Date(dateFrom));
            if (dateTo) builder.where('createdAt', '<=', new Date(dateTo));
          }
        })
        .first(),
    ]);

    const total = countResult?.count || 0;

    // Get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await knex('orderItem')
          .select('orderItem.id', 'orderItem.quantity', 'product.productName')
          .leftJoin('product', 'orderItem.productId', 'product.id')
          .where('orderItem.orderId', order.id);
        
        const designRequests = await knex('designRequest')
          .select('id', 'deadline', 'quantity', 'designTitle')
          .where('orderId', order.id);
            
        return { ...order, items, designRequests };
      })
    );

    return sendPaginated(
      res,
      ordersWithItems,
      {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
      'Orders retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

const getOrderDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await knex('order')
      .select('*')
      .where('id', id)
      .first();

    if (!order) throw new NotFoundError('Order not found');

    // Get order items with product and variant details
    const rawItems = await knex('orderItem')
      .select(
        'orderItem.id',
        'orderItem.orderId',
        'orderItem.productId',
        'orderItem.variantId',
        'orderItem.quantity',
        'orderItem.unitPrice',
        'orderItem.subtotal',
        'product.productName',
        'product.price',
        'product.imageUrl as productImage',
        knex.raw('v.variantName, v.color, v.imageUrl as variantImage')
      )
      .leftJoin('product', 'orderItem.productId', 'product.id')
      .leftJoin('productVariant as v', 'orderItem.variantId', 'v.id')
      .where('orderItem.orderId', id);

    const items = rawItems.map(item => ({
      ...item,
      product: item.productId ? {
        productName: item.productName,
        price: item.price,
        imageUrl: item.productImage
      } : null,
      variant: item.variantId ? {
        variantName: item.variantName + (item.color ? ` - ${item.color}` : ''),
        imageUrl: item.variantImage
      } : null
    }));

    // Get payment info
    const payment = await knex('payment')
      .where('orderId', id)
      .first();

    // Get tracking info
    const tracking = await knex('orderTracking')
      .where('orderId', id)
      .first();

    // Get design requests
    const designRequests = await knex('designRequest')
      .select('id', 'designTitle', 'mockupPreviewUrl', 'designFileUrl', 'status', 'createdAt', 'updatedAt', 'printTechnique', 'printPosition', 'printSize', 'colorPreferences', 'sizeBreakdown')
      .where('orderId', id);

    // Get order status history for cancellation reasons
    const statusHistory = await knex('orderStatusHistory')
      .select('newStatus', 'reason', 'createdAt')
      .where('orderId', id)
      .orderBy('createdAt', 'desc');

    const refundRequestHistory = statusHistory.find(h => h.newStatus === 'REFUND_REQUESTED');
    const cancelReason = refundRequestHistory ? refundRequestHistory.reason : null;

    return sendSuccess(
      res,
      {
        ...order,
        items,
        payment,
        tracking,
        designRequests,
        statusHistory,
        cancelReason,
      },
      'Order detail retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) throw new ValidationError('Status is required');

    const order = await knex('order')
      .select('id')
      .where('id', id)
      .first();
    if (!order) throw new NotFoundError('Order not found');

    const updateData = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'WAITING_FINAL_PAYMENT' && req.body.actualWeight) {
      await knex('order')
        .where('id', id)
        .update({ actualWeight: Number(req.body.actualWeight) });
    }

    const orderFulfillmentService = require('../services/orderFulfillmentService');
    const updatedOrder = await orderFulfillmentService.updateOrderStatus(
      id,
      status,
      req.user.id,
      'Manual status update via Admin Panel'
    );

    // Audit log
    await knex('auditLog')
      .insert({
        id: require('cuid')(),
        userId: req.user.id,
        orderId: id,
        action: `ORDER_STATUS_UPDATED_TO_${status}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .catch(() => {});

    return sendSuccess(res, updatedOrder, `Order status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

const updateOrderTracking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { carrier, trackingNumber, currentLocation, estimatedDeliveryDate, status, notes } =
      req.body;

    const order = await knex('order')
      .select('id')
      .where('id', id)
      .first();
    if (!order) throw new NotFoundError('Order not found');

    const updatedTracking = await orderFulfillmentService.updateOrderTracking(id, {
      carrier,
      trackingNumber,
      currentLocation,
      estimatedDeliveryDate,
      status,
      notes,
    });

    await knex('auditLog')
      .insert({
        id: require('cuid')(),
        userId: req.user.id,
        orderId: id,
        action: 'ORDER_TRACKING_UPDATED',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .catch(() => {});

    return sendSuccess(res, updatedTracking, 'Order tracking updated successfully');
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await knex('order')
      .select('id', 'status')
      .where('id', id)
      .first();
    if (!order) throw new NotFoundError('Order not found');

    if (['DELIVERED', 'SHIPPED'].includes(order.status)) {
      throw new ValidationError(`Cannot cancel order with status ${order.status}`);
    }

    const updatedOrder = await orderFulfillmentService.updateOrderStatus(
      id,
      'CANCELLED',
      req.user.id,
      'Admin canceled',
      'Admin cancelled order'
    );

    // Audit log
    await knex('auditLog')
      .insert({
        id: require('cuid')(),
        userId: req.user.id,
        orderId: id,
        action: 'ORDER_CANCELLED',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .catch(() => {});

    return sendSuccess(res, updatedOrder, 'Order cancelled successfully');
  } catch (error) {
    next(error);
  }
};

const exportOrders = async (req, res, next) => {
  try {
    const orders = await knex('order')
      .select('id', 'orderNumber', 'totalAmount', 'status', 'createdAt')
      .orderBy('createdAt', 'desc');

    // Get item counts for each order
    const ordersWithCounts = await Promise.all(
      orders.map(async (order) => {
        const itemCount = await knex('orderItem')
          .where('orderId', order.id)
          .count('* as count')
          .first()
          .then(r => r?.count || 0);
        return { ...order, itemCount };
      })
    );

    // Convert to CSV format
    const csv = [
      ['Order ID', 'Order Number', 'Total Amount', 'Status', 'Items', 'Created At'].join(','),
      ...ordersWithCounts.map((order) =>
        [
          order.id,
          order.orderNumber,
          order.totalAmount,
          order.status,
          order.itemCount,
          order.createdAt,
        ].join(',')
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DESIGN REQUEST MANAGEMENT
// ============================================================

const getDesignRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filters = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };
    if (status) filters.status = status;

    const [requests, total] = await Promise.all([
      designRequestService.findMany(filters),
      designRequestService.count(filters),
    ]);

    return sendPaginated(
      res,
      requests,
      {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
      'Design requests retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

const getDesignRequestDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await knex('designRequest')
      .select(
        'id',
        'userId',
        'productId',
        'orderId',
        'title',
        'description',
        'status',
        'createdAt',
        'updatedAt'
      )
      .where('id', id)
      .first();

    if (!request) throw new NotFoundError('Design request not found');

    // Get feedback for this design request
    const feedback = await knex('designFeedback')
      .select('id', 'feedbackType', 'comments', 'createdAt')
      .where('designRequestId', id)
      .orderBy('createdAt', 'desc');

    // Get order info
    const order = request.orderId ? await knex('order')
      .select('id', 'orderNumber')
      .where('id', request.orderId)
      .first() : null;

    // Get order items
    const orderItems = request.orderId ? await knex('orderItem')
      .select('id', 'productId', 'quantity')
      .where('orderId', request.orderId) : [];

    return sendSuccess(
      res,
      {
        ...request,
        feedback,
        order,
        orderItems,
      },
      'Design request detail retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

const updateDesignRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, comments, estimatedPrice, hppPrice, mockupPreviewUrl } = req.body;

    if (!status) throw new ValidationError('Status is required');

    const request = await designRequestService.findById(id);
    if (!request) throw new NotFoundError('Design request not found');

    const updated = await designRequestService.updateStatus(id, status);
    
    // Save reject reason or revision notes to request table
    if ((status === 'REJECTED' || status === 'REVISION_REQUESTED') && comments) {
      await require('../config/knex')('designRequest').where({ id }).update({ rejectReason: comments });
    }

    // Update mockup if admin provides a final override
    if (mockupPreviewUrl && status === 'APPROVED') {
      await require('../config/knex')('designRequest').where({ id }).update({ mockupPreviewUrl });
    }

    // Save feedback if provided
    let fullComment = comments || '';
    if (estimatedPrice) {
      fullComment += `\n\nEstimasi Biaya: Rp ${parseInt(estimatedPrice).toLocaleString('id-ID')}`;
    }
    
    if (hppPrice && estimatedPrice) {
      // Save to DB but DO NOT append to fullComment to avoid leaking sensitive data to the customer
      await require('../config/knex')('designRequest').where({ id }).update({ 
        estimatedPrice: parseInt(estimatedPrice)
      }).catch(() => {});
    }

    if (fullComment) {
      await require('../config/knex')('designFeedback').insert({
        id: require('cuid')(),
        designRequestId: id,
        designStaffId: req.user.id,
        feedbackType: status === 'APPROVED' ? 'PRICE_ESTIMATE' : 'REVISION_REQUIRED',
        feedbackText: fullComment,
        createdAt: new Date(),
      });
    }

    // If status changed to APPROVED, REJECTED, or CANCELLED, check if all siblings are processed
    if (['APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      const knex = require('../config/knex');
      const siblings = await knex('designRequest').where('orderId', request.orderId);
      
      const allProcessed = siblings.every(req => 
        ['APPROVED', 'REJECTED', 'CANCELLED'].includes(req.status)
      );

      if (allProcessed) {
        // Calculate new total amount for the order based ONLY on APPROVED designs
        const newTotalAmount = siblings
          .filter(req => req.status === 'APPROVED')
          .reduce((sum, req) => {
            const estPrice = parseFloat(req.estimatedPrice) || 0;
            return sum + estPrice;
          }, 0);

        // Update the parent order
        await knex('order')
          .where('id', request.orderId)
          .update({
            totalAmount: newTotalAmount,
            status: 'CONFIRMED',
            updatedAt: new Date()
          });
      }
    }

    // Try to send email notification to customer
    try {
      const user = await knex('user').where('id', request.userId).first();
      if (user && user.email) {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.ethereal.email',
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        
        const subjectStatus = status === 'APPROVED' ? 'Desain Disetujui' : (status === 'REVISION_REQUESTED' ? 'Desain Perlu Direvisi' : 'Status Desain Diupdate');
        await transporter.sendMail({
          from: `"Arianation CRM" <${process.env.SMTP_USER || 'no-reply@arianation.com'}>`,
          to: user.email,
          subject: `Status Request Desain Anda: ${subjectStatus}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; color: #333;">
              <h2 style="color: #2563eb;">Halo ${user.fullName},</h2>
              <p>Status permintaan desain sablon Anda (<strong>${request.designTitle}</strong>) telah diubah menjadi <strong>${status}</strong>.</p>
              ${fullComment ? `<div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #3b82f6; margin-top: 15px; margin-bottom: 25px;">
                <strong>Catatan dari Admin:</strong><br/>
                ${fullComment.replace(/\n/g, '<br/>')}
              </div>` : ''}
              ${status === 'APPROVED' ? `
              <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/account?tab=sablon" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Lanjutkan Pembayaran
                </a>
              </div>
              <p>Silakan klik tombol di atas untuk melanjutkan pembayaran pesanan Anda.</p>
              ` : `<p style="margin-top: 20px;">Silakan cek <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/account?tab=sablon" style="color: #2563eb; font-weight: bold;">Riwayat Sablon</a> Anda untuk melihat detailnya.</p>
              `}
            </div>
          `
        });
      }
    } catch (emailErr) {
      console.error('Failed to send design notification email:', emailErr);
    }

    // In-app Notification and Web Push Notification
    try {
      let subjectStatus = 'Status Desain Diupdate';
      if (status === 'APPROVED') subjectStatus = 'Desain Disetujui';
      else if (status === 'REVISION_REQUESTED') subjectStatus = 'Desain Perlu Direvisi';
      else if (status === 'REJECTED') subjectStatus = 'Desain Ditolak';
      else if (status === 'CANCELLED') subjectStatus = 'Penawaran Dibatalkan';

      await notificationService.queueCustomerNotification({
        referenceId: id,
        referenceType: 'DESIGN_REQUEST',
        userId: request.userId,
        type: `DESIGN_REQUEST_${status}`,
        title: subjectStatus,
        message: `Permintaan desain "${request.designTitle}" Anda sekarang berstatus ${status.replace('_', ' ')}. ${fullComment ? 'Ada catatan dari Admin.' : ''}${status === 'APPROVED' ? ' Silakan menuju halaman Riwayat Sablon untuk melanjutkan pembayaran.' : ''}`
      });
    } catch (err) {
      console.error('Failed to queue customer notification:', err);
    }

    // Audit log
    await knex('auditLog')
      .insert({
        id: require('cuid')(),
        userId: req.user.id,
        action: `DESIGN_REQUEST_STATUS_UPDATED_TO_${status}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .catch(() => {});

    return sendSuccess(res, updated, `Design request status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// USER MANAGEMENT
// ============================================================

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    const filters = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };
    if (role) filters.role = role;
    if (search) filters.search = search;

    const [users, total] = await Promise.all([
      userService.findMany(filters),
      userService.count(filters),
    ]);

    return sendPaginated(
      res,
      users,
      {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
      'Users retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

const getUserDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await knex('user')
      .select('id', 'email', 'fullName', 'phone', 'role', 'isActive', 'createdAt', 'updatedAt')
      .where('id', id)
      .first();

    if (!user) throw new NotFoundError('User not found');

    // Get customer profile if exists
    const customerProfile = await knex('customerProfile')
      .where('userId', id)
      .first();

    // Get design staff info if exists
    const designStaffInfo = await knex('designStaffInfo')
      .where('userId', id)
      .first();

    return sendSuccess(
      res,
      {
        ...user,
        customerProfile,
        designStaffInfo,
      },
      'User detail retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) throw new ValidationError('Role is required');

    const user = await userService.findById(id);
    if (!user) throw new NotFoundError('User not found');

    const updated = await knex('user')
      .where('id', id)
      .update({
        role,
        updatedAt: new Date(),
      });

    if (!updated) throw new NotFoundError('User not found');

    const updatedUser = await knex('user')
      .select('id', 'email', 'fullName', 'role')
      .where('id', id)
      .first();

    // Audit log
    await knex('auditLog')
      .insert({
        id: require('cuid')(),
        userId: req.user.id,
        action: `USER_ROLE_CHANGED_TO_${role}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .catch(() => {});

    return sendSuccess(res, updatedUser, `User role updated to ${role}`);
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) throw new ValidationError('isActive is required');

    const user = await userService.findById(id);
    if (!user) throw new NotFoundError('User not found');

    const updated = await knex('user')
      .where('id', id)
      .update({
        isActive: isActive ? 1 : 0,
        updatedAt: new Date(),
      });

    if (!updated) throw new NotFoundError('User not found');

    const updatedUser = await knex('user')
      .select('id', 'email', 'fullName', 'isActive')
      .where('id', id)
      .first();

    // Audit log
    await knex('auditLog')
      .insert({
        id: require('cuid')(),
        userId: req.user.id,
        action: `USER_STATUS_CHANGED_TO_${isActive ? 'ACTIVE' : 'INACTIVE'}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .catch(() => {});

    return sendSuccess(res, updatedUser, `User status changed to ${isActive ? 'active' : 'inactive'}`);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PAYMENT MANAGEMENT
// ============================================================

const getPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filters = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };
    if (status) filters.status = status;

    const [payments, total] = await Promise.all([
      paymentService.findMany(filters),
      paymentService.count(filters),
    ]);

    return sendPaginated(
      res,
      payments,
      {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
      'Payments retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await paymentService.findById(id);
    if (!payment) throw new NotFoundError('Payment not found');

    const updated = await knex('payment')
      .where('id', id)
      .update({
        status: 'COMPLETED',
        verifiedBy: req.user.id,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      });

    if (!updated) throw new NotFoundError('Payment not found');

    // Update order status to CONFIRMED
    await knex('order')
      .where('id', payment.orderId)
      .update({
        status: 'CONFIRMED',
        updatedAt: new Date(),
      });

    const updatedPayment = await knex('payment')
      .where('id', id)
      .first();

    // Audit log
    await knex('auditLog')
      .insert({
        id: require('cuid')(),
        userId: req.user.id,
        action: 'PAYMENT_VERIFIED',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .catch(() => {});

    return sendSuccess(res, updatedPayment, 'Payment verified successfully');
  } catch (error) {
    next(error);
  }
};

const processRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await paymentService.findById(id);
    if (!payment) throw new NotFoundError('Payment not found');

    const updated = await knex('payment')
      .where('id', id)
      .update({
        status: 'FAILED',
        notes: reason || 'Refund processed',
        updatedAt: new Date(),
      });

    if (!updated) throw new NotFoundError('Payment not found');

    // Update order status to CANCELLED
    await knex('order')
      .where('id', payment.orderId)
      .update({
        status: 'CANCELLED',
        updatedAt: new Date(),
      });

    const updatedPayment = await knex('payment')
      .where('id', id)
      .first();

    // Audit log
    await knex('auditLog')
      .insert({
        id: require('cuid')(),
        userId: req.user.id,
        action: 'REFUND_PROCESSED',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .catch(() => {});

    return sendSuccess(res, updatedPayment, 'Refund processed successfully');
  } catch (error) {
    next(error);
  }
};

// ============================================================
// AUDIT LOGS
// ============================================================

const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action, userId } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let query = knex('auditLog');
    
    if (action) {
      query = query.where('action', 'like', `%${action}%`);
    }
    if (userId) {
      query = query.where('userId', userId);
    }

    const [logs, countResult] = await Promise.all([
      query
        .select('id', 'userId', 'action', 'ipAddress', 'createdAt')
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit, 10))
        .offset(skip),
      knex('auditLog')
        .count('* as count')
        .modify((builder) => {
          if (action) builder.where('action', 'like', `%${action}%`);
          if (userId) builder.where('userId', userId);
        })
        .first(),
    ]);

    const total = countResult?.count || 0;

    return sendPaginated(
      res,
      logs,
      {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
      'Audit logs retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

const uploadImageHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const url = req.file.url || `/uploads/products/${req.file.filename}`;
    return res.status(200).json({ success: true, url });
  } catch (error) {
    next(error);
  }
};

const getCouriers = async (req, res, next) => {
  try {
    const couriers = await knex('couriers').orderBy('name', 'asc');
    return sendSuccess(res, couriers, 'Daftar kurir berhasil diambil');
  } catch (error) {
    next(error);
  }
};

const toggleCourier = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { isActive } = req.body;

    await knex('couriers').where('code', code).update({ isActive });
    return sendSuccess(res, { code, isActive }, 'Status kurir berhasil diupdate');
  } catch (error) {
    next(error);
  }
};

const requestPickup = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const order = await knex('order').where('id', id).first();
    if (!order) throw new NotFoundError('Pesanan tidak ditemukan');

    if (order.status !== 'READY_TO_SHIP') {
      throw new BadRequestError('Hanya pesanan berstatus READY_TO_SHIP yang bisa di-pickup');
    }

    if (!order.shippingCourier) {
      throw new BadRequestError('Kurir pengiriman belum dipilih untuk pesanan ini');
    }

    const orderItems = await knex('orderItem')
      .join('product', 'orderItem.productId', '=', 'product.id')
      .select('orderItem.*', 'product.productName', 'product.weight')
      .where('orderId', id);

    let totalWeight = Number(req.body.actualWeight) || order.actualWeight || 0;
    
    let items = orderItems.map(item => {
      const itemWeight = item.weight || 250;
      if (!order.actualWeight && !req.body.actualWeight) totalWeight += itemWeight * item.quantity;
      return {
        name: item.productName || "Product",
        description: `Variant: ${item.variantId || 'Default'}`,
        value: item.unitPrice || 100000,
        weight: itemWeight,
        quantity: item.quantity || 1
      };
    });

    if (items.length === 0) {
      items = [
        {
          name: `Custom Sablon Order`,
          description: `Pesanan #${order.orderNumber || id}`,
          value: order.totalAmount || 100000,
          weight: totalWeight || 250,
          quantity: 1
        }
      ];
    }

    if (totalWeight === 0) totalWeight = 250;

    let customerName = 'Customer';
    let customerEmail = 'customer@example.com';
    let customerPhone = '081234567890';
    let destinationAddress = 'Alamat tidak diketahui';
    let destinationPostalCode = 12345;

    if (order.deliveryAddress) {
      try {
        const addr = JSON.parse(order.deliveryAddress);
        customerName = addr.fullName || customerName;
        customerEmail = addr.email || customerEmail;
        customerPhone = addr.phone || customerPhone;
        destinationAddress = `${addr.addressLine1}, ${addr.city}`;
        destinationPostalCode = addr.postalCode || destinationPostalCode;
      } catch(e) {}
    }

    // Map display courier name (e.g. "J&T - EZ") to Biteship courier codes
    let mappedCourier = 'jnt';
    let mappedType = 'reg';
    if (order.shippingCourier) {
      const lowerCourier = order.shippingCourier.toLowerCase();
      
      if (lowerCourier.includes('j&t') || lowerCourier.includes('jnt')) mappedCourier = 'jnt';
      else if (lowerCourier.includes('sicepat')) mappedCourier = 'sicepat';
      else if (lowerCourier.includes('jne')) mappedCourier = 'jne';
      else if (lowerCourier.includes('anteraja')) mappedCourier = 'anteraja';
      else if (lowerCourier.includes('ninja')) mappedCourier = 'ninja';
      else if (lowerCourier.includes('gojek')) mappedCourier = 'gojek';
      else if (lowerCourier.includes('grab')) mappedCourier = 'grab';
      else if (lowerCourier.includes('idexpress')) mappedCourier = 'idexpress';
      else if (lowerCourier.includes('lion')) mappedCourier = 'lion';
      else if (lowerCourier.includes('paxel')) mappedCourier = 'paxel';
      else if (lowerCourier.includes('pos')) mappedCourier = 'pos';
      else if (lowerCourier.includes('sap')) mappedCourier = 'sap';
      else if (lowerCourier.includes('tiki')) mappedCourier = 'tiki';
      else if (lowerCourier.includes('wahana')) mappedCourier = 'wahana';
      else mappedCourier = lowerCourier.split(' ')[0].trim();
      
      let rawType = '';
      if (lowerCourier.includes('-')) {
        rawType = lowerCourier.split('-')[1].trim().replace(/\s+/g, '_');
      }

      if (lowerCourier.includes('ez')) mappedType = 'ez';
      else if (lowerCourier.includes('reg') && !lowerCourier.includes('reg_pack') && !lowerCourier.includes('reg_half')) mappedType = 'reg';
      else if (lowerCourier.includes('best') || lowerCourier.includes('besok sampai')) mappedType = 'best';
      else if (lowerCourier.includes('yes')) mappedType = 'yes';
      else if (lowerCourier.includes('oke')) mappedType = 'oke';
      else if (lowerCourier.includes('sameday') || lowerCourier.includes('same day')) mappedType = 'same_day';
      else if (lowerCourier.includes('instan')) mappedType = 'instant';
      else if (rawType) mappedType = rawType;
      
      // Override for specific couriers that have strict Biteship service types
      if (mappedCourier === 'ninja') mappedType = 'standard';
      if (mappedCourier === 'pos' && mappedType === 'same_day') mappedType = 'sameday'; // POS uses sameday
      if (mappedCourier === 'wahana') mappedType = 'deno'; // Wahana only uses deno
      if (mappedCourier === 'paxel') mappedType = 'medium'; // Safe fallback for paxel
    }

    const shippingService = require('../services/shippingService');
    const biteshipResponse = await shippingService.createOrderPickup({
      orderId: order.id,
      customerName,
      customerEmail,
      customerPhone,
      destinationAddress,
      destinationPostalCode,
      items,
      courierCode: mappedCourier,
      courierType: mappedType,
      totalWeight
    });

    const trackingNumber = biteshipResponse.courier?.waybill_id || biteshipResponse.id; 
    const biteshipOrderId = biteshipResponse.id;

    await knex('order').where('id', id).update({
      trackingNumber,
      biteshipOrderId,
      status: 'SHIPPED', 
      updatedAt: new Date()
    });

    let existingTracking = await knex('orderTracking').where('orderId', id).first();
    let trackingId;
    if (existingTracking) {
      trackingId = existingTracking.id;
      await knex('orderTracking').where('id', trackingId).update({
        trackingNumber,
        carrier: order.shippingCourier,
        status: 'SHIPPED',
        updatedAt: new Date()
      });
    } else {
      trackingId = require('cuid')();
      await knex('orderTracking').insert({
        id: trackingId,
        orderId: id,
        trackingNumber,
        carrier: order.shippingCourier,
        status: 'SHIPPED',
        estimatedDeliveryDate: null,
        updatedAt: new Date()
      });
    }
    
    await knex('trackingHistory').insert({
      id: require('cuid')(),
      trackingId,
      status: 'SHIPPED',
      notes: 'Kurir telah dipesan, menunggu penjemputan (pickup)',
      timestamp: new Date()
    });
    
    try {
      const orderFulfillmentService = require('../services/orderFulfillmentService');
      await orderFulfillmentService.updateOrderStatus(
        id,
        'SHIPPED',
        req.user.id,
        'Kurir telah dipesan',
        `AWB: ${trackingNumber}`
      );
    } catch(err) { console.error('Failed to update fulfillment timeline:', err.message); }

    try {
      const notificationService = require('../services/notificationService');
      const notif = await notificationService.queueNotification({
        orderId: order.id,
        userId: order.userId || null,
        type: 'SHIPPED',
        title: 'Pesanan Dikirim 🚚',
        message: `Pesanan Anda sedang dalam pengiriman menggunakan kurir ${order.shippingCourier.toUpperCase()}. Nomor Resi: ${trackingNumber}`,
      });
      await notificationService.sendOrderNotification(notif.id);
    } catch (err) {
      console.error('[Admin Controller] Error sending pickup notification:', err.message);
    }

    return sendSuccess(res, { trackingNumber, biteshipOrderId }, 'Pickup berhasil diminta');
  } catch (error) {
    next(error);
  }
};

const completePickup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await knex('order').where({ id }).first();
    if (!order) throw new NotFoundError('Pesanan tidak ditemukan');
    
    if (order.status !== 'READY_TO_SHIP' || order.deliveryType !== 'PICKUP') {
        throw new BadRequestError('Pesanan ini belum siap diambil atau bukan pesanan Pickup.');
    }

    await knex('order').where('id', id).update({
      status: 'DELIVERED', 
      updatedAt: new Date()
    });

    try {
      const orderFulfillmentService = require('../services/orderFulfillmentService');
      await orderFulfillmentService.updateOrderStatus(
        id,
        'DELIVERED',
        req.user.id,
        'Pesanan telah diambil oleh customer',
        'Self Pickup Selesai'
      );
    } catch(err) { console.error('Failed to update fulfillment timeline:', err.message); }

    try {
      const notificationService = require('../services/notificationService');
      const notif = await notificationService.queueNotification({
        orderId: order.id,
        userId: order.userId || null,
        type: 'DELIVERED',
        title: 'Pesanan Selesai 🎉',
        message: 'Terima kasih telah berkunjung dan mengambil pesanan Anda di Arianation!',
      });
      await notificationService.sendOrderNotification(notif.id);
    } catch (err) {
      console.error('[Admin Controller] Error sending pickup completion notification:', err.message);
    }

    return sendSuccess(res, null, 'Pickup berhasil dikonfirmasi');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImageHandler,
  getOrders,
  getOrderDetail,
  updateOrderStatus,
  updateOrderTracking,
  cancelOrder,
  exportOrders,
  getDesignRequests,
  getDesignRequestDetail,
  updateDesignRequestStatus,
  getUsers,
  getUserDetail,
  updateUserRole,
  toggleUserStatus,
  getPayments,
  verifyPayment,
  processRefund,
  getAuditLogs,
  getCouriers,
  toggleCourier,
  requestPickup,
  completePickup
};

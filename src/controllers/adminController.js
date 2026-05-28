// src/controllers/adminController.js

const knex = require('../config/knex');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { NotFoundError, ValidationError } = require('../utils/errors');
const orderFulfillmentService = require('../services/orderFulfillmentService');
const productService = require('../services/productService');
const orderService = require('../services/orderService');
const userService = require('../services/userService');
const designRequestService = require('../services/designRequestService');
const paymentService = require('../services/paymentService');

// ============================================================
// DASHBOARD
// ============================================================

const getDashboard = async (req, res, next) => {
  try {
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
      price,
      stockQuantity,
      productType,
      imageUrl,
      businessType,
    } = req.body;

    if (!categoryId || !productName || !price || !productType || !businessType) {
      throw new ValidationError(
        'Missing required fields: categoryId, productName, price, productType, businessType'
      );
    }

    const product = await productService.create({
      categoryId,
      productName,
      description: description || null,
      price: parseFloat(price),
      stockQuantity: parseInt(stockQuantity, 10) || 0,
      productType,
      imageUrl: imageUrl || null,
      businessType,
    });

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
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productName, description, price, stockQuantity, productType, imageUrl, isActive } =
      req.body;

    const product = await productService.findById(id);
    if (!product) throw new NotFoundError('Product not found');

    const updated = await productService.update(id, {
      ...(productName && { productName }),
      ...(description !== undefined && { description }),
      ...(price && { price: parseFloat(price) }),
      ...(stockQuantity !== undefined && { stockQuantity: parseInt(stockQuantity, 10) }),
      ...(productType && { productType }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(isActive !== undefined && { isActive }),
    });

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
        .select('id', 'orderNumber', 'totalAmount', 'status', 'createdAt')
        .orderBy('createdAt', 'desc')
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
          .join('product', 'orderItem.productId', 'product.id')
          .where('orderItem.orderId', order.id);
        return { ...order, items };
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
      .select(
        'id',
        'orderNumber',
        'totalAmount',
        'status',
        'createdAt',
        'updatedAt'
      )
      .where('id', id)
      .first();

    if (!order) throw new NotFoundError('Order not found');

    // Get order items with product and variant details
    const items = await knex('orderItem')
      .select(
        'orderItem.id',
        'orderItem.orderId',
        'orderItem.productId',
        'orderItem.quantity',
        'orderItem.subtotal',
        'product.productName',
        'product.price'
      )
      .join('product', 'orderItem.productId', 'product.id')
      .where('orderItem.orderId', id);

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
      .select('id', 'status', 'createdAt', 'updatedAt')
      .where('orderId', id);

    return sendSuccess(
      res,
      {
        ...order,
        items,
        payment,
        tracking,
        designRequests,
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

    const updated = await knex('order')
      .where('id', id)
      .update({
        status,
        updatedAt: new Date(),
      });

    if (!updated) throw new NotFoundError('Order not found');

    const updatedOrder = await knex('order')
      .select('id', 'orderNumber', 'totalAmount', 'status', 'createdAt')
      .where('id', id)
      .first();

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

    await knex('order')
      .where('id', id)
      .update({
        status: 'CANCELLED',
        updatedAt: new Date(),
      });

    const cancelled = await knex('order')
      .select('id', 'orderNumber', 'totalAmount', 'status', 'createdAt')
      .where('id', id)
      .first();

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

    return sendSuccess(res, cancelled, 'Order cancelled successfully');
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
    const { status } = req.body;

    if (!status) throw new ValidationError('Status is required');

    const request = await designRequestService.findById(id);
    if (!request) throw new NotFoundError('Design request not found');

    const updated = await designRequestService.updateStatus(id, status);

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

module.exports = {
  getDashboard,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
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
};

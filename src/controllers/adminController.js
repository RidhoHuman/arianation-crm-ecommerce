// src/controllers/adminController.js

const prisma = require('../config/database');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { NotFoundError, ValidationError } = require('../utils/errors');
const orderFulfillmentService = require('../services/orderFulfillmentService');

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
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.order.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.designRequest.count({ where: { status: 'SUBMITTED' } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ['CONFIRMED', 'DELIVERED'] } },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _count: { id: true },
        _sum: { subtotal: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: { select: { productName: true } } } },
        },
      }),
    ]);

    // Get product names for top products
    const topProductDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { productName: true },
        });
        return {
          productId: item.productId,
          productName: product?.productName,
          count: item._count.id,
          revenue: item._sum.subtotal,
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
        total: totalRevenue._sum.totalAmount || 0,
        currency: 'IDR',
      },
      customers: {
        total: totalCustomers,
      },
      designs: {
        pending: pendingDesigns,
      },
      topProducts: topProductDetails,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        itemCount: order.items.length,
        createdAt: order.createdAt,
      })),
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
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const where = {};
    if (search) {
      where.OR = [
        { productName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (businessType) where.businessType = businessType;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit, 10),
        include: { category: true, variants: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return sendPaginated(res, products, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    }, 'Products retrieved successfully');
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
      throw new ValidationError('Missing required fields: categoryId, productName, price, productType, businessType');
    }

    const product = await prisma.product.create({
      data: {
        categoryId,
        productName,
        description: description || null,
        price: parseFloat(price),
        stockQuantity: parseInt(stockQuantity, 10) || 0,
        productType,
        imageUrl: imageUrl || null,
        businessType,
      },
      include: { category: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PRODUCT_CREATED',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    }).catch(() => {});

    return sendCreated(res, product, 'Product created successfully');
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productName, description, price, stockQuantity, productType, imageUrl, isActive } = req.body;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError('Product not found');

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(productName && { productName }),
        ...(description !== undefined && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(stockQuantity !== undefined && { stockQuantity: parseInt(stockQuantity, 10) }),
        ...(productType && { productType }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { category: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PRODUCT_UPDATED',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    }).catch(() => {});

    return sendSuccess(res, updated, 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError('Product not found');

    await prisma.product.delete({ where: { id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PRODUCT_DELETED',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    }).catch(() => {});

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

    const where = {};
    if (status) where.status = status;
    if (search) where.orderNumber = { contains: search, mode: 'insensitive' };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit, 10),
        include: { items: { include: { product: { select: { productName: true } } } }, payment: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return sendPaginated(res, orders, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    }, 'Orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getOrderDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true, variant: true, designRequest: true } },
        payment: true,
        tracking: true,
        designRequests: { include: { feedback: true } },
      },
    });

    if (!order) throw new NotFoundError('Order not found');

    return sendSuccess(res, order, 'Order detail retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) throw new ValidationError('Status is required');

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundError('Order not found');

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true, payment: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        orderId: id,
        action: `ORDER_STATUS_UPDATED_TO_${status}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    }).catch(() => {});

    return sendSuccess(res, updated, `Order status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

const updateOrderTracking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { carrier, trackingNumber, currentLocation, estimatedDeliveryDate, status, notes } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundError('Order not found');

    const updatedTracking = await orderFulfillmentService.updateOrderTracking(id, {
      carrier,
      trackingNumber,
      currentLocation,
      estimatedDeliveryDate,
      status,
      notes,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        orderId: id,
        action: 'ORDER_TRACKING_UPDATED',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    }).catch(() => {});

    return sendSuccess(res, updatedTracking, 'Order tracking updated successfully');
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundError('Order not found');

    if (['DELIVERED', 'SHIPPED'].includes(order.status)) {
      throw new ValidationError(`Cannot cancel order with status ${order.status}`);
    }

    const cancelled = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        orderId: id,
        action: 'ORDER_CANCELLED',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    }).catch(() => {});

    return sendSuccess(res, cancelled, 'Order cancelled successfully');
  } catch (error) {
    next(error);
  }
};

const exportOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: { include: { product: { select: { productName: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    // Convert to CSV format
    const csv = [
      ['Order ID', 'Order Number', 'Total Amount', 'Status', 'Items', 'Created At'].join(','),
      ...orders.map((order) =>
        [
          order.id,
          order.orderNumber,
          order.totalAmount,
          order.status,
          order.items.length,
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
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const where = {};
    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      prisma.designRequest.findMany({
        where,
        skip,
        take: parseInt(limit, 10),
        include: { feedback: true, order: { select: { orderNumber: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.designRequest.count({ where }),
    ]);

    return sendPaginated(res, requests, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    }, 'Design requests retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getDesignRequestDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await prisma.designRequest.findUnique({
      where: { id },
      include: { feedback: { orderBy: { createdAt: 'desc' } }, order: true, orderItems: true },
    });

    if (!request) throw new NotFoundError('Design request not found');

    return sendSuccess(res, request, 'Design request detail retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateDesignRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) throw new ValidationError('Status is required');

    const request = await prisma.designRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundError('Design request not found');

    const updated = await prisma.designRequest.update({
      where: { id },
      data: { status },
      include: { feedback: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: `DESIGN_REQUEST_STATUS_UPDATED_TO_${status}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    }).catch(() => {});

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
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const where = {};
    if (role) where.role = role;
    if (search) where.email = { contains: search, mode: 'insensitive' };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit, 10),
        select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return sendPaginated(res, users, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    }, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getUserDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        customerProfile: true,
        designStaffInfo: true,
      },
    });

    if (!user) throw new NotFoundError('User not found');

    // Remove password
    delete user.password;

    return sendSuccess(res, user, 'User detail retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) throw new ValidationError('Role is required');

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User not found');

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, fullName: true, role: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: `USER_ROLE_CHANGED_TO_${role}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    }).catch(() => {});

    return sendSuccess(res, updated, `User role updated to ${role}`);
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) throw new ValidationError('isActive is required');

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User not found');

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, email: true, fullName: true, isActive: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: `USER_STATUS_CHANGED_TO_${isActive ? 'ACTIVE' : 'INACTIVE'}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    }).catch(() => {});

    return sendSuccess(res, updated, `User status changed to ${isActive ? 'active' : 'inactive'}`);
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
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const where = {};
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: parseInt(limit, 10),
        include: { order: { select: { orderNumber: true, totalAmount: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    return sendPaginated(res, payments, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    }, 'Payments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundError('Payment not found');

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        verifiedBy: req.user.id,
        verifiedAt: new Date(),
      },
      include: { order: true },
    });

    // Update order status to CONFIRMED
    await prisma.order.update({
      where: { id: updated.orderId },
      data: { status: 'CONFIRMED' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PAYMENT_VERIFIED',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    }).catch(() => {});

    return sendSuccess(res, updated, 'Payment verified successfully');
  } catch (error) {
    next(error);
  }
};

const processRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundError('Payment not found');

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status: 'FAILED',
        notes: reason || 'Refund processed',
      },
      include: { order: true },
    });

    // Update order status to CANCELLED
    await prisma.order.update({
      where: { id: updated.orderId },
      data: { status: 'CANCELLED' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'REFUND_PROCESSED',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    }).catch(() => {});

    return sendSuccess(res, updated, 'Refund processed successfully');
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

    const where = {};
    if (action) where.action = { contains: action };
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: parseInt(limit, 10),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return sendPaginated(res, logs, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    }, 'Audit logs retrieved successfully');
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

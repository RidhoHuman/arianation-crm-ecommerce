// src/controllers/analyticsController.js

const prisma = require('../config/database');
const { sendSuccess } = require('../utils/response');

// ============================================================
// SALES ANALYTICS
// ============================================================

const getSalesAnalytics = async (req, res, next) => {
  try {
    const { days = 30, period = 'daily' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days, 10));

    // Get sales data
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: daysAgo },
        status: { in: ['CONFIRMED', 'DELIVERED'] },
      },
      include: { items: true },
    });

    // Group by date
    const salesByDate = {};
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = {
          date,
          orders: 0,
          items: 0,
          revenue: 0,
        };
      }
      salesByDate[date].orders += 1;
      salesByDate[date].items += order.items.length;
      salesByDate[date].revenue += order.totalAmount;
    });

    const data = Object.values(salesByDate).sort((a, b) => new Date(a.date) - new Date(b.date));

    return sendSuccess(res, {
      period: days + ' days',
      data,
      summary: {
        totalOrders: orders.length,
        totalItems: orders.reduce((sum, o) => sum + o.items.length, 0),
        totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      },
    }, 'Sales analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ============================================================
// REVENUE ANALYTICS
// ============================================================

const getRevenueAnalytics = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days, 10));

    // Revenue by category
    const revenueByCategory = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { subtotal: true },
      _count: { id: true },
      where: {
        order: {
          createdAt: { gte: daysAgo },
          status: { in: ['CONFIRMED', 'DELIVERED'] },
        },
      },
    });

    // Get product category info
    const categoryRevenue = await Promise.all(
      revenueByCategory.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { category: true },
        });
        return {
          category: product?.category.categoryName || 'Unknown',
          productId: item.productId,
          productName: product?.productName,
          revenue: item._sum.subtotal || 0,
          itemsSold: item._count.id,
        };
      })
    );

    // Total revenue
    const totalRevenue = categoryRevenue.reduce((sum, item) => sum + item.revenue, 0);

    // Revenue by payment method
    const paymentMethodRevenue = await prisma.payment.groupBy({
      by: ['method'],
      _sum: { amount: true },
      _count: { id: true },
      where: {
        createdAt: { gte: daysAgo },
        status: 'COMPLETED',
      },
    });

    return sendSuccess(res, {
      period: days + ' days',
      totalRevenue,
      byCategory: categoryRevenue.sort((a, b) => b.revenue - a.revenue),
      byPaymentMethod: paymentMethodRevenue.map((item) => ({
        method: item.method,
        revenue: item._sum.amount || 0,
        transactions: item._count.id,
      })),
    }, 'Revenue analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ORDER ANALYTICS
// ============================================================

const getOrderAnalytics = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days, 10));

    // Orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { totalAmount: true },
      where: { createdAt: { gte: daysAgo } },
    });

    // Orders by date
    const ordersByDate = await prisma.order.findMany({
      where: { createdAt: { gte: daysAgo } },
      select: { createdAt: true, totalAmount: true },
    });

    const dateMap = {};
    ordersByDate.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!dateMap[date]) {
        dateMap[date] = { date, count: 0, revenue: 0 };
      }
      dateMap[date].count += 1;
      dateMap[date].revenue += order.totalAmount;
    });

    // Average order value
    const avgOrderValue = ordersByDate.length > 0
      ? ordersByDate.reduce((sum, o) => sum + o.totalAmount, 0) / ordersByDate.length
      : 0;

    return sendSuccess(res, {
      period: days + ' days',
      byStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
        revenue: item._sum.totalAmount || 0,
      })),
      byDate: Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date)),
      summary: {
        totalOrders: ordersByDate.length,
        avgOrderValue: Math.round(avgOrderValue),
      },
    }, 'Order analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CUSTOMER ANALYTICS
// ============================================================

const getCustomerAnalytics = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days, 10));

    // Total customers
    const totalCustomers = await prisma.user.count({
      where: { role: 'CUSTOMER' },
    });

    // New customers
    const newCustomers = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: { gte: daysAgo },
      },
    });

    // Customers by tier
    const customerTiers = await prisma.customerMetrics.groupBy({
      by: ['currentTier'],
      _count: { id: true },
    });

    // Top customers by spending
    const topCustomers = await prisma.order.groupBy({
      by: ['userId'],
      _sum: { totalAmount: true },
      _count: { id: true },
      where: { createdAt: { gte: daysAgo } },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 10,
    });

    const topCustomerDetails = await Promise.all(
      topCustomers.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.userId },
          select: { email: true, fullName: true },
        });
        return {
          userId: item.userId,
          email: user?.email,
          name: user?.fullName,
          totalSpent: item._sum.totalAmount || 0,
          orderCount: item._count.id,
        };
      })
    );

    return sendSuccess(res, {
      period: days + ' days',
      totalCustomers,
      newCustomers,
      byTier: customerTiers.map((item) => ({
        tier: item.currentTier,
        count: item._count.id,
      })),
      topCustomers: topCustomerDetails,
    }, 'Customer analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DESIGN REQUEST ANALYTICS
// ============================================================

const getDesignAnalytics = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days, 10));

    // Designs by status
    const designsByStatus = await prisma.designRequest.groupBy({
      by: ['status'],
      _count: { id: true },
      where: { createdAt: { gte: daysAgo } },
    });

    // Total designs submitted
    const totalDesigns = await prisma.designRequest.count({
      where: { createdAt: { gte: daysAgo } },
    });

    // Designs by product type
    const designsByType = await prisma.designRequest.groupBy({
      by: ['productTypeForSablon'],
      _count: { id: true },
      where: { createdAt: { gte: daysAgo } },
    });

    // Designs by date
    const designs = await prisma.designRequest.findMany({
      where: { createdAt: { gte: daysAgo } },
      select: { createdAt: true, status: true },
    });

    const designsByDate = {};
    designs.forEach((design) => {
      const date = design.createdAt.toISOString().split('T')[0];
      if (!designsByDate[date]) {
        designsByDate[date] = { date, submitted: 0, approved: 0, rejected: 0 };
      }
      designsByDate[date].submitted += 1;
      if (design.status === 'APPROVED') designsByDate[date].approved += 1;
      if (design.status === 'REJECTED') designsByDate[date].rejected += 1;
    });

    // Approval rate
    const approved = designsByStatus.find((item) => item.status === 'APPROVED')?._count.id || 0;
    const rejected = designsByStatus.find((item) => item.status === 'REJECTED')?._count.id || 0;
    const approvalRate = totalDesigns > 0 ? Math.round((approved / totalDesigns) * 100) : 0;

    return sendSuccess(res, {
      period: days + ' days',
      totalDesigns,
      approvalRate: approvalRate + '%',
      byStatus: designsByStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
      byProductType: designsByType.map((item) => ({
        type: item.productTypeForSablon || 'Unspecified',
        count: item._count.id,
      })),
      byDate: Object.values(designsByDate).sort((a, b) => new Date(a.date) - new Date(b.date)),
    }, 'Design analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalesAnalytics,
  getRevenueAnalytics,
  getOrderAnalytics,
  getCustomerAnalytics,
  getDesignAnalytics,
};

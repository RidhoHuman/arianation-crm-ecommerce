// src/controllers/analyticsController.js

const knex = require('../config/knex');
const { sendSuccess } = require('../utils/response');

// ============================================================
// SALES ANALYTICS
// ============================================================

const getSalesAnalytics = async (req, res, next) => {
  try {
    const { days = 30, period = 'daily' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days, 10));

    // Get sales data with order items
    const orders = await knex('order')
      .select(
        'order.id',
        'order.createdAt',
        'order.totalAmount',
        knex.raw('COUNT(orderItem.id) as itemCount')
      )
      .leftJoin('orderItem', 'order.id', 'orderItem.orderId')
      .where('order.createdAt', '>=', daysAgo)
      .whereIn('order.status', ['CONFIRMED', 'DELIVERED'])
      .groupBy('order.id', 'order.createdAt', 'order.totalAmount');

    // Get summary
    const summary = await knex('order')
      .select(
        knex.raw('COUNT(DISTINCT order.id) as totalOrders'),
        knex.raw('COALESCE(SUM(orderItem.quantity), 0) as totalItems'),
        knex.raw('COALESCE(SUM(order.totalAmount), 0) as totalRevenue')
      )
      .leftJoin('orderItem', 'order.id', 'orderItem.orderId')
      .where('order.createdAt', '>=', daysAgo)
      .whereIn('order.status', ['CONFIRMED', 'DELIVERED'])
      .first();

    // Group by date
    const salesByDate = {};
    orders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = {
          date,
          orders: 0,
          items: 0,
          revenue: 0,
        };
      }
      salesByDate[date].orders += 1;
      salesByDate[date].items += parseInt(order.itemCount, 10) || 0;
      salesByDate[date].revenue += order.totalAmount;
    });

    const data = Object.values(salesByDate).sort((a, b) => new Date(a.date) - new Date(b.date));

    return sendSuccess(
      res,
      {
        period: days + ' days',
        data,
        summary: {
          totalOrders: parseInt(summary.totalOrders, 10),
          totalItems: parseInt(summary.totalItems, 10),
          totalRevenue: parseFloat(summary.totalRevenue),
        },
      },
      'Sales analytics retrieved successfully'
    );
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

    // Revenue by product/category
    const revenueByCategory = await knex('orderItem')
      .select(
        'product.id as productId',
        'product.productName',
        'productCategory.categoryName as category',
        knex.raw('COALESCE(SUM(orderItem.subtotal), 0) as revenue'),
        knex.raw('COUNT(orderItem.id) as itemsSold')
      )
      .join('product', 'orderItem.productId', 'product.id')
      .join('productCategory', 'product.categoryId', 'productCategory.id')
      .join('order', 'orderItem.orderId', 'order.id')
      .where('order.createdAt', '>=', daysAgo)
      .whereIn('order.status', ['CONFIRMED', 'DELIVERED'])
      .groupBy('product.id', 'product.productName', 'productCategory.categoryName')
      .orderBy('revenue', 'desc');

    // Total revenue
    const totalRevenue = revenueByCategory.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0);

    // Revenue by payment method
    const paymentMethodRevenue = await knex('payment')
      .select(
        'paymentMethod as method',
        knex.raw('COALESCE(SUM(amount), 0) as revenue'),
        knex.raw('COUNT(id) as transactions')
      )
      .where('createdAt', '>=', daysAgo)
      .where('status', 'COMPLETED')
      .groupBy('paymentMethod');

    return sendSuccess(
      res,
      {
        period: days + ' days',
        totalRevenue,
        byCategory: revenueByCategory.map((item) => ({
          category: item.category || 'Unknown',
          productId: item.productId,
          productName: item.productName,
          revenue: parseFloat(item.revenue || 0),
          itemsSold: parseInt(item.itemsSold, 10),
        })),
        byPaymentMethod: paymentMethodRevenue.map((item) => ({
          method: item.method,
          revenue: parseFloat(item.revenue || 0),
          transactions: parseInt(item.transactions, 10),
        })),
      },
      'Revenue analytics retrieved successfully'
    );
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
    const ordersByStatus = await knex('order')
      .select(
        'status',
        knex.raw('COUNT(id) as count'),
        knex.raw('COALESCE(SUM(totalAmount), 0) as revenue')
      )
      .where('createdAt', '>=', daysAgo)
      .groupBy('status');

    // Orders by date
    const ordersByDate = await knex('order')
      .select('createdAt', 'totalAmount')
      .where('createdAt', '>=', daysAgo);

    const dateMap = {};
    ordersByDate.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      if (!dateMap[date]) {
        dateMap[date] = { date, count: 0, revenue: 0 };
      }
      dateMap[date].count += 1;
      dateMap[date].revenue += order.totalAmount;
    });

    // Average order value
    const avgOrderValue =
      ordersByDate.length > 0
        ? ordersByDate.reduce((sum, o) => sum + o.totalAmount, 0) / ordersByDate.length
        : 0;

    return sendSuccess(
      res,
      {
        period: days + ' days',
        byStatus: ordersByStatus.map((item) => ({
          status: item.status,
          count: parseInt(item.count, 10),
          revenue: parseFloat(item.revenue || 0),
        })),
        byDate: Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date)),
        summary: {
          totalOrders: ordersByDate.length,
          avgOrderValue: Math.round(avgOrderValue),
        },
      },
      'Order analytics retrieved successfully'
    );
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
    const totalCustomersResult = await knex('user')
      .count('id as total')
      .where('role', 'CUSTOMER')
      .first();
    const totalCustomers = parseInt(totalCustomersResult.total, 10);

    // New customers
    const newCustomersResult = await knex('user')
      .count('id as total')
      .where('role', 'CUSTOMER')
      .where('createdAt', '>=', daysAgo)
      .first();
    const newCustomers = parseInt(newCustomersResult.total, 10);

    // Customers by tier
    const customerTiers = await knex('customerMetrics')
      .select('currentTier')
      .count('id as count')
      .groupBy('currentTier');

    // Top customers by spending
    const topCustomers = await knex('order')
      .select(
        'userId',
        knex.raw('SUM(totalAmount) as totalSpent'),
        knex.raw('COUNT(id) as orderCount')
      )
      .where('createdAt', '>=', daysAgo)
      .groupBy('userId')
      .orderBy('totalSpent', 'desc')
      .limit(10);

    // Get user details for top customers
    const topCustomerDetails = await Promise.all(
      topCustomers.map(async (item) => {
        const user = await knex('user')
          .select('email', 'fullName')
          .where('id', item.userId)
          .first();
        return {
          userId: item.userId,
          email: user?.email,
          name: user?.fullName,
          totalSpent: parseFloat(item.totalSpent || 0),
          orderCount: parseInt(item.orderCount, 10),
        };
      })
    );

    return sendSuccess(
      res,
      {
        period: days + ' days',
        totalCustomers,
        newCustomers,
        byTier: customerTiers.map((item) => ({
          tier: item.currentTier,
          count: parseInt(item.count, 10),
        })),
        topCustomers: topCustomerDetails,
      },
      'Customer analytics retrieved successfully'
    );
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
    const designsByStatus = await knex('designRequest')
      .select('status')
      .count('id as count')
      .where('createdAt', '>=', daysAgo)
      .groupBy('status');

    // Total designs submitted
    const totalDesignsResult = await knex('designRequest')
      .count('id as total')
      .where('createdAt', '>=', daysAgo)
      .first();
    const totalDesigns = parseInt(totalDesignsResult.total, 10);

    // Designs by product type
    const designsByType = await knex('designRequest')
      .select('productTypeForSablon')
      .count('id as count')
      .where('createdAt', '>=', daysAgo)
      .groupBy('productTypeForSablon');

    // Designs by date
    const designs = await knex('designRequest')
      .select('createdAt', 'status')
      .where('createdAt', '>=', daysAgo);

    const designsByDate = {};
    designs.forEach((design) => {
      const date = new Date(design.createdAt).toISOString().split('T')[0];
      if (!designsByDate[date]) {
        designsByDate[date] = { date, submitted: 0, approved: 0, rejected: 0 };
      }
      designsByDate[date].submitted += 1;
      if (design.status === 'APPROVED') designsByDate[date].approved += 1;
      if (design.status === 'REJECTED') designsByDate[date].rejected += 1;
    });

    // Approval rate
    const approved = designsByStatus.find((item) => item.status === 'APPROVED')?.count || 0;
    const rejected = designsByStatus.find((item) => item.status === 'REJECTED')?.count || 0;
    const approvalRate = totalDesigns > 0 ? Math.round((approved / totalDesigns) * 100) : 0;

    return sendSuccess(
      res,
      {
        period: days + ' days',
        totalDesigns,
        approvalRate: approvalRate + '%',
        byStatus: designsByStatus.map((item) => ({
          status: item.status,
          count: parseInt(item.count, 10),
        })),
        byProductType: designsByType.map((item) => ({
          type: item.productTypeForSablon || 'Unspecified',
          count: parseInt(item.count, 10),
        })),
        byDate: Object.values(designsByDate).sort((a, b) => new Date(a.date) - new Date(b.date)),
      },
      'Design analytics retrieved successfully'
    );
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

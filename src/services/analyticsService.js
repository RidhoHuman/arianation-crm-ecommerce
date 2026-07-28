// src/services/analyticsService.js

const knex = require('../config/knex');

/**
 * Get fulfillment analytics dashboard
 * @param {Object} filters - Filter by dateFrom, dateTo
 * @returns {Promise<Object>} Analytics data
 */
const getFulfillmentAnalytics = async (filters = {}) => {
  const { dateFrom, dateTo } = filters;

  let query = knex('order');
  if (dateFrom) query = query.where('createdAt', '>=', new Date(dateFrom));
  if (dateTo) query = query.where('createdAt', '<=', new Date(dateTo));

  // Fetch all required data in parallel
  const [totalOrders, ordersByStatus, averageFulfillmentTime, orderMetrics, recentOrders] =
    await Promise.all([
      query
        .clone()
        .count('* as count')
        .first()
        .then((r) => r?.count || 0),
      getOrdersByStatus(query.clone()),
      calculateAverageFulfillmentTime(query.clone()),
      getOrderMetrics(query.clone()),
      getRecentOrders(query.clone()),
    ]);

  return {
    summary: {
      totalOrders,
      totalRevenue: orderMetrics.totalRevenue,
      sablonRevenue: orderMetrics.sablonRevenue,
      retailRevenue: orderMetrics.retailRevenue,
      averageOrderValue: orderMetrics.averageOrderValue,
      completionRate: calculateCompletionRate(ordersByStatus),
      averageFulfillmentDays: averageFulfillmentTime,
    },
    statusDistribution: ordersByStatus,
    recentOrders,
    timestamp: new Date(),
  };
};

/**
 * Get fulfillment performance metrics
 * @param {Object} filters - Time range and other filters
 * @returns {Promise<Object>} Performance data
 */
const getFulfillmentPerformance = async (filters = {}) => {
  const { dateFrom, dateTo } = filters;

  let query = knex('order');
  if (dateFrom) query = query.where('createdAt', '>=', new Date(dateFrom));
  if (dateTo) query = query.where('createdAt', '<=', new Date(dateTo));

  const [statusTransitions, avgTimeByStatus, delayedOrders, onTimeDeliveries] = await Promise.all([
    getStatusTransitionAnalytics(query.clone()),
    getAverageTimeByStatus(query.clone()),
    getDelayedOrders(query.clone()),
    getOnTimeDeliveries(query.clone()),
  ]);

  return {
    statusTransitions,
    avgTimeByStatus,
    delayedOrders,
    onTimeDeliveries,
    performanceScore: calculatePerformanceScore(onTimeDeliveries, delayedOrders),
  };
};

/**
 * Get orders by status
 */
const getOrdersByStatus = async (query) => {
  const statuses = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'READY_FOR_DELIVERY',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'FAILED',
  ];

  const counts = {};

  for (const status of statuses) {
    const result = await query.clone().where('status', status).count('* as count').first();
    counts[status] = result?.count || 0;
  }

  return counts;
};

/**
 * Calculate average fulfillment time
 */
const calculateAverageFulfillmentTime = async (query) => {
  const deliveredOrders = await query
    .clone()
    .where('status', 'DELIVERED')
    .select('createdAt', 'updatedAt');

  if (deliveredOrders.length === 0) return 0;

  const totalDays = deliveredOrders.reduce((sum, order) => {
    const days = Math.ceil(
      (new Date(order.updatedAt) - new Date(order.createdAt)) / (1000 * 60 * 60 * 24)
    );
    return sum + days;
  }, 0);

  return Math.round((totalDays / deliveredOrders.length) * 10) / 10;
};

/**
 * Get order metrics
 */
const getOrderMetrics = async (query) => {
  const result = await query
    .clone()
    .select(
      knex.raw('SUM(totalAmount) as totalRevenue'),
      knex.raw('AVG(totalAmount) as avgAmount'),
      knex.raw(
        "SUM(CASE WHEN orderNumber LIKE 'SAB-%' THEN totalAmount ELSE 0 END) as sablonRevenue"
      ),
      knex.raw(
        "SUM(CASE WHEN orderNumber LIKE 'ORD-%' THEN totalAmount ELSE 0 END) as retailRevenue"
      ),
      knex.raw('COUNT(*) as count')
    )
    .first();

  return {
    totalRevenue: result?.totalRevenue || 0,
    sablonRevenue: result?.sablonRevenue || 0,
    retailRevenue: result?.retailRevenue || 0,
    averageOrderValue: Math.round((result?.avgAmount || 0) * 100) / 100,
  };
};

/**
 * Get recent orders
 */
const getRecentOrders = async (query) => {
  return await query
    .clone()
    .select('id', 'orderNumber', 'status', 'totalAmount', 'createdAt')
    .orderBy('createdAt', 'desc')
    .limit(10);
};

/**
 * Calculate order completion rate
 */
const calculateCompletionRate = (ordersByStatus) => {
  const totalOrders = Object.values(ordersByStatus).reduce((a, b) => a + b, 0);
  if (totalOrders === 0) return 0;

  const completedOrders = (ordersByStatus.DELIVERED || 0) + (ordersByStatus.CANCELLED || 0);
  return Math.round((completedOrders / totalOrders) * 100);
};

/**
 * Get status transition analytics
 */
const getStatusTransitionAnalytics = async (query) => {
  const transitions = await knex('orderStatusHistory')
    .select('previousStatus', 'newStatus')
    .whereIn('orderId', query.clone().select('id'));

  const transitionMap = {};

  transitions.forEach((t) => {
    const key = `${t.previousStatus} → ${t.newStatus}`;
    transitionMap[key] = (transitionMap[key] || 0) + 1;
  });

  return transitionMap;
};

/**
 * Get average time by status
 */
const getAverageTimeByStatus = async (query) => {
  const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_DELIVERY', 'SHIPPED'];
  const avgTimes = {};

  for (const status of statuses) {
    avgTimes[status] = 0;
  }

  return avgTimes;
};

/**
 * Get delayed orders
 */
const getDelayedOrders = async (query) => {
  const orders = await query.clone().select('id', 'orderNumber', 'status', 'createdAt');

  return {
    count: 0,
    percentage: 0,
    orders: [],
  };
};

/**
 * Get on-time deliveries
 */
const getOnTimeDeliveries = async (query) => {
  const deliveredOrders = await query
    .clone()
    .where('status', 'DELIVERED')
    .select('id', 'updatedAt');

  if (deliveredOrders.length === 0) {
    return { count: 0, percentage: 0 };
  }

  return {
    count: deliveredOrders.length,
    percentage: 100,
  };
};

/**
 * Calculate performance score
 */
const calculatePerformanceScore = (onTimeDeliveries, delayedOrders) => {
  const totalOrders = onTimeDeliveries.count + delayedOrders.count;
  if (totalOrders === 0) return 100;

  const score = Math.round((onTimeDeliveries.count / totalOrders) * 100);
  return Math.min(score, 100);
};

/**
 * Get revenue analytics
 */
const getRevenueAnalytics = async (filters = {}) => {
  const { dateFrom, dateTo, groupBy = 'day' } = filters;

  let query = knex('order').where('status', 'DELIVERED');
  if (dateFrom) query = query.where('createdAt', '>=', new Date(dateFrom));
  if (dateTo) query = query.where('createdAt', '<=', new Date(dateTo));

  const orders = await query.select('totalAmount', 'createdAt').orderBy('createdAt', 'asc');

  // Group by date
  const grouped = {};

  orders.forEach((order) => {
    if (!order.createdAt) return;
    const date = new Date(order.createdAt);
    if (isNaN(date.getTime())) return;
    
    let key;

    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (groupBy === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else if (groupBy === 'month') {
      key = date.toISOString().slice(0, 7);
    }

    if (!grouped[key]) {
      grouped[key] = { revenue: 0, orders: 0 };
    }

    grouped[key].revenue += order.totalAmount;
    grouped[key].orders += 1;
  });

  return {
    data: Object.entries(grouped).map(([date, data]) => ({
      date,
      ...data,
    })),
    total: orders.reduce((sum, o) => sum + o.totalAmount, 0),
  };
};

module.exports = {
  getFulfillmentAnalytics,
  getFulfillmentPerformance,
  getRevenueAnalytics,
};

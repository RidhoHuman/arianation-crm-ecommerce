// src/services/analyticsService.js

const prisma = require('../config/database');

/**
 * Get fulfillment analytics dashboard
 * @param {Object} filters - Filter by dateFrom, dateTo
 * @returns {Promise<Object>} Analytics data
 */
const getFulfillmentAnalytics = async (filters = {}) => {
  const { dateFrom, dateTo } = filters;

  const dateFilter = {};
  if (dateFrom) dateFilter.gte = new Date(dateFrom);
  if (dateTo) dateFilter.lte = new Date(dateTo);

  const whereClause = dateFrom || dateTo ? { createdAt: dateFilter } : {};

  // Fetch all required data in parallel
  const [
    totalOrders,
    ordersByStatus,
    averageFulfillmentTime,
    orderMetrics,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: whereClause }),
    getOrdersByStatus(whereClause),
    calculateAverageFulfillmentTime(whereClause),
    getOrderMetrics(whereClause),
    getRecentOrders(whereClause),
  ]);

  return {
    summary: {
      totalOrders,
      totalRevenue: orderMetrics.totalRevenue,
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
  const { dateFrom, dateTo, orderBy = 'createdAt' } = filters;

  const dateFilter = {};
  if (dateFrom) dateFilter.gte = new Date(dateFrom);
  if (dateTo) dateFilter.lte = new Date(dateTo);

  const whereClause = dateFrom || dateTo ? { createdAt: dateFilter } : {};

  const [
    statusTransitions,
    avgTimeByStatus,
    delayedOrders,
    onTimeDeliveries,
  ] = await Promise.all([
    getStatusTransitionAnalytics(whereClause),
    getAverageTimeByStatus(whereClause),
    getDelayedOrders(whereClause),
    getOnTimeDeliveries(whereClause),
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
const getOrdersByStatus = async (whereClause) => {
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
    counts[status] = await prisma.order.count({
      where: { ...whereClause, status },
    });
  }

  return counts;
};

/**
 * Calculate average fulfillment time
 */
const calculateAverageFulfillmentTime = async (whereClause) => {
  const deliveredOrders = await prisma.order.findMany({
    where: { ...whereClause, status: 'DELIVERED' },
    select: { createdAt: true, updatedAt: true },
  });

  if (deliveredOrders.length === 0) return 0;

  const totalDays = deliveredOrders.reduce((sum, order) => {
    const days = Math.ceil(
      (order.updatedAt - order.createdAt) / (1000 * 60 * 60 * 24)
    );
    return sum + days;
  }, 0);

  return Math.round(totalDays / deliveredOrders.length * 10) / 10;
};

/**
 * Get order metrics
 */
const getOrderMetrics = async (whereClause) => {
  const result = await prisma.order.aggregate({
    where: whereClause,
    _sum: { totalAmount: true },
    _avg: { totalAmount: true },
    _count: true,
  });

  return {
    totalRevenue: result._sum.totalAmount || 0,
    averageOrderValue: Math.round((result._avg.totalAmount || 0) * 100) / 100,
  };
};

/**
 * Get recent orders
 */
const getRecentOrders = async (whereClause) => {
  return await prisma.order.findMany({
    where: whereClause,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
};

/**
 * Calculate order completion rate
 */
const calculateCompletionRate = (ordersByStatus) => {
  const totalOrders = Object.values(ordersByStatus).reduce((a, b) => a + b, 0);
  if (totalOrders === 0) return 0;

  const completedOrders =
    (ordersByStatus.DELIVERED || 0) + (ordersByStatus.CANCELLED || 0);
  return Math.round((completedOrders / totalOrders) * 100);
};

/**
 * Get status transition analytics
 */
const getStatusTransitionAnalytics = async (whereClause) => {
  const transitions = await prisma.orderStatusHistory.findMany({
    where: {
      order: whereClause,
    },
    select: {
      previousStatus: true,
      newStatus: true,
    },
  });

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
const getAverageTimeByStatus = async (whereClause) => {
  const statuses = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'READY_FOR_DELIVERY',
    'SHIPPED',
  ];
  const avgTimes = {};

  for (const status of statuses) {
    const histories = await prisma.orderStatusHistory.findMany({
      where: {
        newStatus: status,
        order: whereClause,
      },
      select: { createdAt: true },
    });

    if (histories.length === 0) {
      avgTimes[status] = 0;
      continue;
    }

    // Calculate average time spent in previous statuses
    const times = histories.map((h) => {
      const createdTime = new Date(h.createdAt).getTime();
      const now = new Date().getTime();
      return Math.ceil((now - createdTime) / (1000 * 60 * 60)); // hours
    });

    avgTimes[status] = Math.round(
      times.reduce((a, b) => a + b, 0) / times.length
    );
  }

  return avgTimes;
};

/**
 * Get delayed orders
 */
const getDelayedOrders = async (whereClause) => {
  const orders = await prisma.order.findMany({
    where: whereClause,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      createdAt: true,
      tracking: {
        select: { estimatedDeliveryDate: true },
      },
    },
  });

  const delayed = orders.filter((order) => {
    if (!order.tracking?.estimatedDeliveryDate) return false;
    return new Date(order.tracking.estimatedDeliveryDate) < new Date();
  });

  return {
    count: delayed.length,
    percentage: Math.round((delayed.length / orders.length) * 100) || 0,
    orders: delayed.slice(0, 5),
  };
};

/**
 * Get on-time deliveries
 */
const getOnTimeDeliveries = async (whereClause) => {
  const deliveredOrders = await prisma.order.findMany({
    where: { ...whereClause, status: 'DELIVERED' },
    select: {
      id: true,
      updatedAt: true,
      tracking: {
        select: { estimatedDeliveryDate: true },
      },
    },
  });

  if (deliveredOrders.length === 0) {
    return { count: 0, percentage: 0 };
  }

  const onTime = deliveredOrders.filter(
    (order) =>
      order.tracking?.estimatedDeliveryDate &&
      new Date(order.updatedAt) <=
        new Date(order.tracking.estimatedDeliveryDate)
  );

  return {
    count: onTime.length,
    percentage: Math.round((onTime.length / deliveredOrders.length) * 100),
  };
};

/**
 * Calculate performance score
 */
const calculatePerformanceScore = (onTimeDeliveries, delayedOrders) => {
  const totalOrders = onTimeDeliveries.count + delayedOrders.count;
  if (totalOrders === 0) return 100;

  const score = Math.round(
    (onTimeDeliveries.count / totalOrders) * 100
  );
  return Math.min(score, 100);
};

/**
 * Get revenue analytics
 */
const getRevenueAnalytics = async (filters = {}) => {
  const { dateFrom, dateTo, groupBy = 'day' } = filters;

  const dateFilter = {};
  if (dateFrom) dateFilter.gte = new Date(dateFrom);
  if (dateTo) dateFilter.lte = new Date(dateTo);

  const whereClause =
    dateFrom || dateTo ? { createdAt: dateFilter } : {};

  const orders = await prisma.order.findMany({
    where: {
      ...whereClause,
      status: 'DELIVERED',
    },
    select: {
      totalAmount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date
  const grouped = {};

  orders.forEach((order) => {
    const date = new Date(order.createdAt);
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

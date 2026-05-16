// __tests__/batchOperations.spec.js

const batchOperationsService = require('../src/services/batchOperationsService');
const analyticsService = require('../src/services/analyticsService');
const { BadRequestError } = require('../src/utils/errors');

describe('Batch Operations Service', () => {
  describe('batchUpdateOrderStatus', () => {
    test('throws error for empty orderIds array', async () => {
      await expect(
        batchOperationsService.batchUpdateOrderStatus([], 'CONFIRMED', 'user123')
      ).rejects.toThrow(BadRequestError);
    });

    test('throws error for more than 100 orders', async () => {
      const orderIds = Array(101).fill('order123');
      await expect(
        batchOperationsService.batchUpdateOrderStatus(orderIds, 'CONFIRMED', 'user123')
      ).rejects.toThrow(BadRequestError);
    });

    test('throws error for non-array orderIds', async () => {
      await expect(
        batchOperationsService.batchUpdateOrderStatus('order123', 'CONFIRMED', 'user123')
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('batchCancelOrders', () => {
    test('throws error for empty orderIds array', async () => {
      await expect(
        batchOperationsService.batchCancelOrders([], 'user123')
      ).rejects.toThrow(BadRequestError);
    });

    test('throws error for more than 100 orders', async () => {
      const orderIds = Array(101).fill('order123');
      await expect(
        batchOperationsService.batchCancelOrders(orderIds, 'user123')
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('batchUpdateTracking', () => {
    test('throws error for empty updates array', async () => {
      await expect(
        batchOperationsService.batchUpdateTracking([])
      ).rejects.toThrow(BadRequestError);
    });

    test('throws error for more than 100 updates', async () => {
      const updates = Array(101).fill({ orderId: 'order123' });
      await expect(
        batchOperationsService.batchUpdateTracking(updates)
      ).rejects.toThrow(BadRequestError);
    });

    test('throws error for missing orderId in update', async () => {
      const updates = [
        { trackingNumber: 'JNE123', carrier: 'JNE' },
      ];
      const result = await batchOperationsService.batchUpdateTracking(updates);
      expect(result.failed).toBeGreaterThan(0);
    });
  });

  describe('batchSendNotifications', () => {
    test('throws error for empty orderIds array', async () => {
      await expect(
        batchOperationsService.batchSendNotifications([])
      ).rejects.toThrow(BadRequestError);
    });

    test('throws error for more than 100 orders', async () => {
      const orderIds = Array(101).fill('order123');
      await expect(
        batchOperationsService.batchSendNotifications(orderIds)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('getOrdersForBatch', () => {
    test('returns orders with default limit', async () => {
      const orders = await batchOperationsService.getOrdersForBatch({});
      expect(Array.isArray(orders)).toBe(true);
    });

    test('respects custom limit', async () => {
      const orders = await batchOperationsService.getOrdersForBatch({ limit: 5 });
      expect(orders.length).toBeLessThanOrEqual(5);
    });

    test('filters by status', async () => {
      const orders = await batchOperationsService.getOrdersForBatch({ status: 'PENDING' });
      if (orders.length > 0) {
        expect(orders[0].status).toBe('PENDING');
      }
    });
  });
});

describe('Analytics Service', () => {
  describe('getFulfillmentAnalytics', () => {
    test('returns analytics with summary', async () => {
      const analytics = await analyticsService.getFulfillmentAnalytics();
      expect(analytics).toHaveProperty('summary');
      expect(analytics).toHaveProperty('statusDistribution');
      expect(analytics).toHaveProperty('recentOrders');
    });

    test('summary contains required fields', async () => {
      const analytics = await analyticsService.getFulfillmentAnalytics();
      const { summary } = analytics;
      expect(summary).toHaveProperty('totalOrders');
      expect(summary).toHaveProperty('totalRevenue');
      expect(summary).toHaveProperty('averageOrderValue');
      expect(summary).toHaveProperty('completionRate');
      expect(summary).toHaveProperty('averageFulfillmentDays');
    });

    test('status distribution includes all statuses', async () => {
      const analytics = await analyticsService.getFulfillmentAnalytics();
      const { statusDistribution } = analytics;
      const expectedStatuses = [
        'PENDING', 'CONFIRMED', 'PROCESSING',
        'READY_FOR_DELIVERY', 'SHIPPED', 'DELIVERED',
        'CANCELLED', 'FAILED'
      ];
      expectedStatuses.forEach(status => {
        expect(statusDistribution).toHaveProperty(status);
      });
    });
  });

  describe('getFulfillmentPerformance', () => {
    test('returns performance data', async () => {
      const performance = await analyticsService.getFulfillmentPerformance();
      expect(performance).toHaveProperty('statusTransitions');
      expect(performance).toHaveProperty('avgTimeByStatus');
      expect(performance).toHaveProperty('delayedOrders');
      expect(performance).toHaveProperty('onTimeDeliveries');
      expect(performance).toHaveProperty('performanceScore');
    });

    test('performance score is between 0 and 100', async () => {
      const performance = await analyticsService.getFulfillmentPerformance();
      expect(performance.performanceScore).toBeGreaterThanOrEqual(0);
      expect(performance.performanceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('getRevenueAnalytics', () => {
    test('returns revenue data', async () => {
      const revenue = await analyticsService.getRevenueAnalytics();
      expect(revenue).toHaveProperty('data');
      expect(revenue).toHaveProperty('total');
      expect(Array.isArray(revenue.data)).toBe(true);
    });

    test('groups by day by default', async () => {
      const revenue = await analyticsService.getRevenueAnalytics();
      if (revenue.data.length > 0) {
        expect(revenue.data[0]).toHaveProperty('date');
        expect(revenue.data[0]).toHaveProperty('revenue');
        expect(revenue.data[0]).toHaveProperty('orders');
      }
    });

    test('supports grouping by week', async () => {
      const revenue = await analyticsService.getRevenueAnalytics({ groupBy: 'week' });
      expect(revenue).toHaveProperty('data');
    });

    test('supports grouping by month', async () => {
      const revenue = await analyticsService.getRevenueAnalytics({ groupBy: 'month' });
      expect(revenue).toHaveProperty('data');
    });
  });
});

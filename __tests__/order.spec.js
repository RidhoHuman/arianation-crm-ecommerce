const orderService = require('../src/services/orderService');
const knex = require('../src/config/knex');

describe('orderService', () => {
  const mockUserId = 'user-test-123';

  beforeEach(async () => {
    // Clear order-related tables
    await knex('payment').delete();
    await knex('orderTracking').delete();
    await knex('orderItem').delete();
    await knex('order').delete();
    await knex('user').delete();

    // Create a mock user
    await knex('user').insert({
      id: mockUserId,
      email: 'customer@example.com',
      password: 'pw',
      fullName: 'Customer One',
      role: 'CUSTOMER',
      isActive: 1,
    });
  });

  describe('create()', () => {
    test('should create an order, payment, and tracking successfully', async () => {
      const orderData = {
        userId: mockUserId,
        orderNumber: 'ORD-999',
        status: 'PENDING',
        totalPrice: 200000,
        paymentStatus: 'UNPAID',
        shippingAddress: '123 Test Street',
        trackingNumber: 'TRK-ABC',
      };

      const createdOrder = await orderService.create(orderData);

      expect(createdOrder).toBeDefined();
      expect(createdOrder.id).toBeDefined();
      expect(createdOrder.orderNumber).toBe(orderData.orderNumber);
      expect(createdOrder.totalPrice).toBe(orderData.totalPrice);
      expect(createdOrder.paymentStatus).toBe(orderData.paymentStatus);
      expect(createdOrder.trackingNumber).toBe(orderData.trackingNumber);

      // Verify tables directly
      const dbOrder = await knex('order').where('id', createdOrder.id).first();
      expect(dbOrder).toBeDefined();
      expect(dbOrder.totalAmount).toBe(orderData.totalPrice);

      const dbPayment = await knex('payment').where('orderId', createdOrder.id).first();
      expect(dbPayment).toBeDefined();
      expect(dbPayment.status).toBe(orderData.paymentStatus);

      const dbTracking = await knex('orderTracking').where('orderId', createdOrder.id).first();
      expect(dbTracking).toBeDefined();
      expect(dbTracking.trackingNumber).toBe(orderData.trackingNumber);
    });
  });

  describe('findById() and findByOrderNumber()', () => {
    const id = 'ord-111';
    const orderNumber = 'ORD-111';

    beforeEach(async () => {
      await knex('order').insert({
        id,
        orderNumber,
        userId: mockUserId,
        totalAmount: 150000,
        status: 'PENDING',
        shippingAddress: '456 Test Ave',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await knex('payment').insert({
        id: 'pay-111',
        orderId: id,
        amount: 150000,
        method: 'CREDIT_CARD',
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    test('should retrieve order by ID with mapped prices and statuses', async () => {
      const order = await orderService.findById(id);
      expect(order).toBeDefined();
      expect(order.orderNumber).toBe(orderNumber);
      expect(order.totalPrice).toBe(150000);
      expect(order.paymentStatus).toBe('COMPLETED');
      expect(order.trackingNumber).toBeNull();
    });

    test('should retrieve order by orderNumber', async () => {
      const order = await orderService.findByOrderNumber(orderNumber);
      expect(order).toBeDefined();
      expect(order.id).toBe(id);
    });

    test('should return null if not found', async () => {
      const byId = await orderService.findById('non-existent');
      expect(byId).toBeNull();

      const byNum = await orderService.findByOrderNumber('non-existent');
      expect(byNum).toBeNull();
    });
  });

  describe('findMany() and count()', () => {
    beforeEach(async () => {
      await knex('order').insert([
        {
          id: 'o1',
          orderNumber: 'ORD-001',
          userId: mockUserId,
          totalAmount: 100000,
          status: 'PENDING',
          createdAt: new Date(Date.now() - 10000),
          updatedAt: new Date(),
        },
        {
          id: 'o2',
          orderNumber: 'ORD-002',
          userId: 'other-user',
          totalAmount: 300000,
          status: 'DELIVERED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    test('should return all orders and count correctly', async () => {
      const orders = await orderService.findMany();
      expect(orders.length).toBe(2);

      const total = await orderService.count();
      expect(total).toBe(2);
    });

    test('should filter by userId', async () => {
      const orders = await orderService.findMany({ userId: mockUserId });
      expect(orders.length).toBe(1);
      expect(orders[0].id).toBe('o1');

      const total = await orderService.count({ userId: mockUserId });
      expect(total).toBe(1);
    });

    test('should filter by status', async () => {
      const orders = await orderService.findMany({ status: 'DELIVERED' });
      expect(orders.length).toBe(1);
      expect(orders[0].id).toBe('o2');

      const total = await orderService.count({ status: 'DELIVERED' });
      expect(total).toBe(1);
    });
  });

  describe('update() and toggle methods', () => {
    const id = 'ord-update';

    beforeEach(async () => {
      await knex('order').insert({
        id,
        orderNumber: 'ORD-UPD',
        userId: mockUserId,
        totalAmount: 100000,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await knex('payment').insert({
        id: 'pay-upd',
        orderId: id,
        amount: 100000,
        method: 'E_WALLET',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    test('update() should update order, payment and tracking details', async () => {
      const updated = await orderService.update(id, {
        status: 'CONFIRMED',
        totalPrice: 120000,
        paymentStatus: 'COMPLETED',
        trackingNumber: 'TRK-XYZ',
      });

      expect(updated.status).toBe('CONFIRMED');
      expect(updated.totalPrice).toBe(120000);
      expect(updated.paymentStatus).toBe('COMPLETED');
      expect(updated.trackingNumber).toBe('TRK-XYZ');
    });

    test('updateStatus() should update only order status', async () => {
      const updated = await orderService.updateStatus(id, 'PROCESSING');
      expect(updated.status).toBe('PROCESSING');
    });

    test('updatePaymentStatus() should update only payment status', async () => {
      const updated = await orderService.updatePaymentStatus(id, 'REFUNDED');
      expect(updated.paymentStatus).toBe('REFUNDED');
    });

    test('updateTracking() should insert or update tracking number', async () => {
      const updated = await orderService.updateTracking(id, 'NEW-TRACK');
      expect(updated.trackingNumber).toBe('NEW-TRACK');

      const updatedAgain = await orderService.updateTracking(id, 'UPDATED-TRACK');
      expect(updatedAgain.trackingNumber).toBe('UPDATED-TRACK');
    });
  });

  describe('delete()', () => {
    test('should delete order and related rows cascadingly', async () => {
      const id = 'ord-delete';
      await knex('order').insert({
        id,
        orderNumber: 'ORD-DEL',
        userId: mockUserId,
        totalAmount: 100000,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await knex('payment').insert({
        id: 'pay-del',
        orderId: id,
        amount: 100000,
        method: 'BANK_TRANSFER',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await knex('orderTracking').insert({
        id: 'trk-del',
        orderId: id,
        trackingNumber: 'TRK',
        createdAt: new Date(),
      });

      const deleted = await orderService.delete(id);
      expect(deleted).toBe(true);

      const o = await orderService.findById(id);
      expect(o).toBeNull();

      const pay = await knex('payment').where('orderId', id).first();
      expect(pay).toBeUndefined();

      const trk = await knex('orderTracking').where('orderId', id).first();
      expect(trk).toBeUndefined();
    });
  });

  describe('findUserOrders() and getOrderStats()', () => {
    beforeEach(async () => {
      await knex('order').insert([
        {
          id: 'o-stats-1',
          orderNumber: 'ORD-S1',
          userId: mockUserId,
          totalAmount: 150000,
          status: 'DELIVERED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'o-stats-2',
          orderNumber: 'ORD-S2',
          userId: mockUserId,
          totalAmount: 250000,
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    test('findUserOrders should retrieve all orders for a specific user', async () => {
      const orders = await orderService.findUserOrders(mockUserId);
      expect(orders.length).toBe(2);
      expect(orders[0].totalPrice).toBe(150000);
    });

    test('getOrderStats should calculate dashboard statistics', async () => {
      const stats = await orderService.getOrderStats();
      expect(stats.totalOrders).toBe(2);
      expect(stats.totalRevenue).toBe(400000);
      expect(stats.completedOrders).toBe(1); // Only DELIVERED
    });
  });
});

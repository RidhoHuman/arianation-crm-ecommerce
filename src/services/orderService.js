// src/services/orderService.js
const knex = require('../config/knex');

const orderService = {
  // Ambil semua order dengan filter dan pagination
  async findMany({ page = 1, limit = 10, userId, status } = {}) {
    const skip = (page - 1) * limit;
    let query = knex('order');

    if (userId) {
      query = query.where('userId', userId);
    }

    if (status) {
      query = query.where('status', status);
    }

    const orders = await query
      .select(
        'id',
        'userId',
        'orderNumber',
        'status',
        'totalPrice',
        'paymentStatus',
        'shippingAddress',
        'trackingNumber',
        'createdAt',
        'updatedAt'
      )
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(skip);

    return orders;
  },

  // Hitung total order
  async count({ userId, status } = {}) {
    let query = knex('order');

    if (userId) {
      query = query.where('userId', userId);
    }

    if (status) {
      query = query.where('status', status);
    }

    const result = await query.count('* as count').first();
    return result.count;
  },

  // Cari order berdasarkan ID
  async findById(id) {
    const order = await knex('order')
      .select(
        'id',
        'userId',
        'orderNumber',
        'status',
        'totalPrice',
        'paymentStatus',
        'shippingAddress',
        'trackingNumber',
        'createdAt',
        'updatedAt'
      )
      .where('id', id)
      .first();

    return order || null;
  },

  // Cari order berdasarkan orderNumber
  async findByOrderNumber(orderNumber) {
    const order = await knex('order')
      .where('orderNumber', orderNumber)
      .first();

    return order || null;
  },

  // Buat order baru
  async create({
    userId,
    orderNumber,
    status = 'PENDING',
    totalPrice,
    paymentStatus = 'UNPAID',
    shippingAddress,
    trackingNumber = null,
  }) {
    const id = require('cuid')();

    const order = {
      id,
      userId,
      orderNumber,
      status,
      totalPrice,
      paymentStatus,
      shippingAddress,
      trackingNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await knex('order').insert(order);

    return order;
  },

  // Update order
  async update(id, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await knex('order')
      .where('id', id)
      .update(updateData);

    return this.findById(id);
  },

  // Update status order
  async updateStatus(id, status) {
    await knex('order')
      .where('id', id)
      .update({
        status,
        updatedAt: new Date(),
      });

    return this.findById(id);
  },

  // Update payment status
  async updatePaymentStatus(id, paymentStatus) {
    await knex('order')
      .where('id', id)
      .update({
        paymentStatus,
        updatedAt: new Date(),
      });

    return this.findById(id);
  },

  // Update tracking number
  async updateTracking(id, trackingNumber) {
    await knex('order')
      .where('id', id)
      .update({
        trackingNumber,
        updatedAt: new Date(),
      });

    return this.findById(id);
  },

  // Hapus order
  async delete(id) {
    await knex('order')
      .where('id', id)
      .delete();

    return true;
  },

  // Ambil order untuk user tertentu dengan status tertentu
  async findUserOrders(userId, status = null) {
    let query = knex('order').where('userId', userId);

    if (status) {
      query = query.where('status', status);
    }

    const orders = await query
      .select(
        'id',
        'orderNumber',
        'status',
        'totalPrice',
        'paymentStatus',
        'createdAt'
      )
      .orderBy('createdAt', 'desc');

    return orders;
  },

  // Ambil statistik order untuk dashboard
  async getOrderStats() {
    const stats = await knex('order')
      .select(
        knex.raw('COUNT(*) as totalOrders'),
        knex.raw('SUM(totalPrice) as totalRevenue'),
        knex.raw('COUNT(CASE WHEN status = "COMPLETED" THEN 1 END) as completedOrders')
      )
      .first();

    return stats;
  },
};

module.exports = orderService;

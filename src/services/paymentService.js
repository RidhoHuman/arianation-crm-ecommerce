// src/services/paymentService.js
const knex = require('../config/knex');

const paymentService = {
  // Ambil semua payment dengan filter
  async findMany({ page = 1, limit = 10, status, orderId } = {}) {
    const skip = (page - 1) * limit;
    let query = knex('payment');

    if (orderId) {
      query = query.where('orderId', orderId);
    }

    if (status) {
      query = query.where('status', status);
    }

    const payments = await query
      .select(
        'id',
        'orderId',
        'method as paymentMethod',
        'amount',
        'status',
        'transactionId',
        'createdAt',
        'updatedAt'
      )
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(skip);

    return payments;
  },

  // Hitung total payment
  async count({ status, orderId } = {}) {
    let query = knex('payment');

    if (orderId) {
      query = query.where('orderId', orderId);
    }

    if (status) {
      query = query.where('status', status);
    }

    const result = await query.count('* as count').first();
    return result.count;
  },

  // Cari payment berdasarkan ID
  async findById(id) {
    const payment = await knex('payment')
      .select(
        'id',
        'orderId',
        'method as paymentMethod',
        'amount',
        'status',
        'transactionId',
        'createdAt',
        'updatedAt'
      )
      .where('id', id)
      .first();

    return payment || null;
  },

  // Cari payment berdasarkan orderId
  async findByOrderId(orderId) {
    const payment = await knex('payment')
      .where('orderId', orderId)
      .first();

    return payment || null;
  },

  // Cari payment berdasarkan transactionId
  async findByTransactionId(transactionId) {
    const payment = await knex('payment')
      .where('transactionId', transactionId)
      .first();

    return payment || null;
  },

  // Buat payment baru
  async create(data) {
    const { orderId, paymentMethod, amount, status = 'PENDING', transactionId = null, ...rest } = data;
    const id = data.id || require('cuid')();

    const payment = {
      ...rest,
      id,
      orderId,
      method: paymentMethod || data.method,
      amount,
      status,
      transactionId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await knex('payment').insert(payment);

    return payment;
  },

  // Update payment status
  async updateStatus(id, status, transactionId = null) {
    const updateData = {
      status,
      updatedAt: new Date(),
    };

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    await knex('payment')
      .where('id', id)
      .update(updateData);

    return this.findById(id);
  },

  // Update payment
  async update(id, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await knex('payment')
      .where('id', id)
      .update(updateData);

    return this.findById(id);
  },

  // Hapus payment
  async delete(id) {
    await knex('payment')
      .where('id', id)
      .delete();

    return true;
  },

  // Ambil statistik payment
  async getPaymentStats() {
    const stats = await knex('payment')
      .select(
        knex.raw('COUNT(*) as totalTransactions'),
        knex.raw('SUM(amount) as totalAmount'),
        knex.raw('COUNT(CASE WHEN status = "COMPLETED" THEN 1 END) as successfulPayments')
      )
      .first();

    return stats;
  },

  // Ambil payment untuk order tertentu
  async findPaymentsByOrder(orderId) {
    const payments = await knex('payment')
      .where('orderId', orderId)
      .select('id', 'method as paymentMethod', 'amount', 'status', 'transactionId', 'createdAt')
      .orderBy('createdAt', 'desc');

    return payments;
  },
};

module.exports = paymentService;

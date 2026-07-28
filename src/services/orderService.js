// src/services/orderService.js
const knex = require('../config/knex');
const activityService = require('./activityService');

const orderService = {
  // Ambil semua order dengan filter dan pagination
  async findMany({ page = 1, limit = 10, userId, status, excludeStatus } = {}) {
    const skip = (page - 1) * limit;
    let query = knex('order');

    if (userId) {
      query = query.where('order.userId', userId);
    }

    if (status) {
      query = query.where('order.status', status);
    }

    if (excludeStatus && excludeStatus.length > 0) {
      query = query.whereNotIn('order.status', excludeStatus);
    }

    const orders = await query
      .select(
        'id',
        'userId',
        'orderNumber',
        'status',
        'totalAmount as totalPrice',
        'deliveryAddress',
        'shippingCost',
        'shippingCourier',
        'createdAt',
        'updatedAt'
      )
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(skip);

    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      const payments = await knex('payment').whereIn('orderId', orderIds);
      const trackings = await knex('orderTracking').whereIn('orderId', orderIds);

      for (const order of orders) {
        const orderPayments = payments
          .filter((p) => p.orderId === order.id)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        order.paymentStatus = orderPayments.length > 0 ? orderPayments[0].status : null;

        const orderTracking = trackings.find((t) => t.orderId === order.id);
        order.trackingNumber = orderTracking ? orderTracking.trackingNumber : null;
      }
    }

    return orders;
  },

  // Hitung total order
  async count({ userId, status, excludeStatus } = {}) {
    let query = knex('order');

    if (userId) {
      query = query.where('userId', userId);
    }

    if (status) {
      query = query.where('status', status);
    }

    if (excludeStatus && excludeStatus.length > 0) {
      query = query.whereNotIn('status', excludeStatus);
    }

    const result = await query.count('* as count').first();
    return result.count;
  },

  // Cari order berdasarkan ID
  async findById(id) {
    const order = await knex('order')
      .leftJoin('payment', 'order.id', 'payment.orderId')
      .leftJoin('orderTracking', 'order.id', 'orderTracking.orderId')
      .select(
        'order.id',
        'order.userId',
        'order.orderNumber',
        'order.status',
        'order.totalAmount',
        'order.totalAmount as totalPrice',
        'order.paymentOption',
        'order.totalItemPrice',
        'payment.status as paymentStatus',
        'payment.method as paymentMethod',
        'payment.qrisUrl as paymentUrl',
        'order.deliveryAddress',
        'order.shippingCost',
        'order.shippingCourier',
        'order.refundDetails',
        knex.raw('COALESCE(??, ??) as ??', ['orderTracking.trackingNumber', 'order.trackingNumber', 'trackingNumber']),
        'order.createdAt',
        'order.updatedAt'
      )
      .where('order.id', id)
      .first();

    if (order && typeof order.deliveryAddress === 'string') {
      try {
        order.deliveryAddress = JSON.parse(order.deliveryAddress);
      } catch (e) {
        // fail silently if not valid JSON
      }
    }

    return order || null;
  },

  // Cari order berdasarkan orderNumber
  async findByOrderNumber(orderNumber) {
    const order = await knex('order')
      .leftJoin('payment', 'order.id', 'payment.orderId')
      .leftJoin('orderTracking', 'order.id', 'orderTracking.orderId')
      .select(
        'order.id',
        'order.userId',
        'order.orderNumber',
        'order.status',
        'order.totalAmount',
        'order.totalAmount as totalPrice',
        'order.paymentOption',
        'order.totalItemPrice',
        'payment.status as paymentStatus',
        'order.deliveryAddress',
        'order.shippingCost',
        'order.shippingCourier',
        'orderTracking.trackingNumber',
        'order.createdAt',
        'order.updatedAt'
      )
      .where('order.orderNumber', orderNumber)
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
    deliveryAddress,
    trackingNumber = null,
  }) {
    const id = require('cuid')();

    await knex.transaction(async (trx) => {
      // Insert into order
      await trx('order').insert({
        id,
        userId: userId || null,
        orderNumber,
        totalAmount: totalPrice,
        status,
        deliveryAddress: deliveryAddress || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Insert into payment
      await trx('payment').insert({
        id: require('cuid')(),
        orderId: id,
        amount: totalPrice,
        method: 'BANK_TRANSFER',
        status: paymentStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Insert into orderTracking if tracking number is provided
      if (trackingNumber) {
        await trx('orderTracking').insert({
          id: require('cuid')(),
          orderId: id,
          trackingNumber,
          updatedAt: new Date(),
        });
      }
    });

    return this.findById(id);
  },

  // Update order
  async update(id, data) {
    const updateData = {};
    if (data.status) updateData.status = data.status;
    if (data.totalPrice !== undefined) updateData.totalAmount = data.totalPrice;
    if (data.deliveryAddress !== undefined) updateData.deliveryAddress = data.deliveryAddress;
    if (data.orderNumber !== undefined) updateData.orderNumber = data.orderNumber;

    updateData.updatedAt = new Date();

    await knex.transaction(async (trx) => {
      if (Object.keys(updateData).length > 1) {
        // includes updatedAt
        await trx('order').where('id', id).update(updateData);
      }

      if (data.paymentStatus) {
        await trx('payment').where('orderId', id).update({
          status: data.paymentStatus,
          updatedAt: new Date(),
        });
      }

      if (data.trackingNumber !== undefined) {
        const hasTracking = await trx('orderTracking').where('orderId', id).first();
        if (hasTracking) {
          await trx('orderTracking').where('orderId', id).update({
            trackingNumber: data.trackingNumber,
          });
        } else if (data.trackingNumber) {
          await trx('orderTracking').insert({
            id: require('cuid')(),
            orderId: id,
            trackingNumber: data.trackingNumber,
            updatedAt: new Date(),
          });
        }
      }
    });

    return this.findById(id);
  },

  // Update status order
  async updateStatus(id, status, updatedBy = null) {
    const oldOrder = await knex('order').where('id', id).select('orderNumber', 'status').first();

    await knex('order').where('id', id).update({
      status,
      updatedAt: new Date(),
    });

    if (oldOrder && oldOrder.status !== status) {
      await activityService.logActivity({
        userId: updatedBy,
        action: 'Update Status Pesanan',
        details: `Pesanan ${oldOrder.orderNumber || id} berubah status dari ${oldOrder.status} menjadi ${status}`,
        entityType: 'ORDER',
        entityId: id,
      });
    }

    return this.findById(id);
  },

  // Update payment status
  async updatePaymentStatus(id, paymentStatus, updatedBy = null) {
    const oldOrder = await knex('order').where('id', id).select('orderNumber').first();

    await knex('payment').where('orderId', id).update({
      status: paymentStatus,
      updatedAt: new Date(),
    });

    await activityService.logActivity({
      userId: updatedBy,
      action: 'Update Status Pembayaran',
      details: `Pembayaran pesanan ${oldOrder?.orderNumber || id} diubah menjadi ${paymentStatus}`,
      entityType: 'PAYMENT',
      entityId: id,
    });

    return this.findById(id);
  },

  // Update tracking number
  async updateTracking(id, trackingNumber) {
    const hasTracking = await knex('orderTracking').where('orderId', id).first();
    if (hasTracking) {
      await knex('orderTracking').where('orderId', id).update({
        trackingNumber,
      });
    } else {
      await knex('orderTracking').insert({
        id: require('cuid')(),
        orderId: id,
        trackingNumber,
        updatedAt: new Date(),
      });
    }

    return this.findById(id);
  },

  // Hapus order
  async delete(id) {
    await knex.transaction(async (trx) => {
      await trx('payment').where('orderId', id).delete();
      await trx('orderTracking').where('orderId', id).delete();
      await trx('orderItem').where('orderId', id).delete();
      await trx('order').where('id', id).delete();
    });

    return true;
  },

  // Ambil order untuk user tertentu dengan status tertentu
  async findUserOrders(userId, status = null) {
    let query = knex('order').where('order.userId', userId);

    if (status) {
      query = query.where('order.status', status);
    }

    const orders = await query
      .select(
        'order.id',
        'order.orderNumber',
        'order.status',
        'order.totalAmount as totalPrice',
        'order.createdAt'
      )
      .orderBy('order.createdAt', 'desc');

    return orders;
  },

  // Ambil statistik order untuk dashboard
  async getOrderStats() {
    const stats = await knex('order')
      .select(
        knex.raw('COUNT(*) as totalOrders'),
        knex.raw('SUM(totalAmount) as totalRevenue'),
        knex.raw("COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as completedOrders")
      )
      .first();

    return stats;
  },
};

module.exports = orderService;

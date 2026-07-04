// src/services/poService.js
/**
 * Pre-Order Service
 * Handles all pre-order operations, status updates, and PO management
 */

const knex = require('../config/knex');
const { ValidationError, NotFoundError } = require('../utils/errors');
const inventoryService = require('./inventoryService');

class POService {
  /**
   * Create a new pre-order
   * @param {Object} poData - PO data { productId, quantity, customerId, pricePerUnit }
   * @returns {Object} Created PO order
   */
  async createPO(poData) {
    const { productId, quantity, customerId, pricePerUnit } = poData;

    // Validate required fields
    if (!productId || !quantity || !pricePerUnit) {
      throw new ValidationError('productId, quantity, dan pricePerUnit wajib diisi');
    }

    if (quantity < 1) {
      throw new ValidationError('Jumlah PO minimal 1 unit');
    }

    // Check jika produk ada
    const product = await knex('product').where('id', productId).first();
    if (!product) {
      throw new NotFoundError('Produk tidak ditemukan');
    }

    // Set expected delivery (14 hari dari sekarang untuk default)
    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + 14);

    const totalPrice = quantity * pricePerUnit;

    const [poId] = await knex('po_orders').insert({
      productId,
      customerId,
      quantity,
      pricePerUnit,
      totalPrice,
      expectedDelivery: expectedDelivery.toISOString().split('T')[0],
      status: 'pending',
      createdAt: new Date(),
    });

    // Log to inventory_log
    await inventoryService.logInventoryChange(
      productId,
      0, // change = 0, karena belum confirm
      'po_created',
      `PO baru dibuat: ${quantity} unit`,
      poId,
      'po_order',
      customerId
    );

    return this.getPOById(poId);
  }

  /**
   * Get PO by ID
   */
  async getPOById(poId) {
    const po = await knex('po_orders')
      .where('id', poId)
      .first();

    if (!po) {
      throw new NotFoundError('PO order tidak ditemukan');
    }

    // Get product info
    const product = await knex('product')
      .select('id', 'productName', 'price', 'imageUrl')
      .where('id', po.productId)
      .first();

    return {
      ...po,
      product,
    };
  }

  /**
   * Get all PO orders (admin)
   * @param {Object} filters - { status, productId, customerId, page, limit }
   */
  async getAllPOs(filters = {}) {
    const { status, productId, customerId, page = 1, limit = 20 } = filters;

    let query = knex('po_orders');

    if (status) query = query.where('status', status);
    if (productId) query = query.where('productId', productId);
    if (customerId) query = query.where('customerId', customerId);

    const total = await query.clone().count('* as count').first().then(r => r.count);
    const offset = (page - 1) * limit;

    const orders = await query
      .select('*')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);

    // Get product details untuk setiap PO
    const enriched = await Promise.all(
      orders.map(async (po) => {
        const product = await knex('product')
          .select('id', 'productName', 'price', 'imageUrl', 'stockQuantity', 'readyStock')
          .where('id', po.productId)
          .first();

        return { ...po, product };
      })
    );

    return {
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Confirm a PO order (admin confirms PO and deduct dari inventory jika ada stok ready)
   * @param {String} poId - PO ID
   * @param {Object} options - { expectedDelivery, notes }
   */
  async confirmPO(poId, options = {}) {
    const { expectedDelivery, notes } = options;

    const po = await this.getPOById(poId);

    if (po.status !== 'pending') {
      throw new ValidationError(`Hanya PO dengan status 'pending' yang bisa di-confirm. Status saat ini: ${po.status}`);
    }

    // Update PO status
    await knex('po_orders')
      .where('id', poId)
      .update({
        status: 'confirmed',
        confirmedAt: new Date(),
        expectedDelivery: expectedDelivery || po.expectedDelivery,
        notes: notes || po.notes,
      });

    // Log inventory change
    await inventoryService.logInventoryChange(
      po.productId,
      0,
      'po_confirmed',
      `PO ${poId} dikonfirmasi untuk ${po.quantity} unit`,
      poId,
      'po_order'
    );

    return this.getPOById(poId);
  }

  /**
   * Cancel a PO order
   */
  async cancelPO(poId, reason = '') {
    const po = await this.getPOById(poId);

    if (['shipped', 'delivered'].includes(po.status)) {
      throw new ValidationError(`PO dengan status '${po.status}' tidak bisa dibatalkan`);
    }

    await knex('po_orders')
      .where('id', poId)
      .update({
        status: 'cancelled',
        cancelledAt: new Date(),
        notes: reason,
      });

    // Log inventory change
    await inventoryService.logInventoryChange(
      po.productId,
      0,
      'po_cancelled',
      `PO ${poId} dibatalkan. Reason: ${reason}`,
      poId,
      'po_order'
    );

    return this.getPOById(poId);
  }

  /**
   * Mark PO as shipped
   */
  async markShipped(poId, trackingNumber = '') {
    const po = await this.getPOById(poId);

    if (po.status !== 'confirmed') {
      throw new ValidationError(`Hanya PO dengan status 'confirmed' yang bisa di-ship`);
    }

    await knex('po_orders')
      .where('id', poId)
      .update({
        status: 'shipped',
        shippedAt: new Date(),
        notes: `${po.notes || ''}\nTracking: ${trackingNumber}`,
      });

    await inventoryService.logInventoryChange(
      po.productId,
      0,
      'po_shipped',
      `PO ${poId} dikirim dengan tracking: ${trackingNumber}`,
      poId,
      'po_order'
    );

    return this.getPOById(poId);
  }

  /**
   * Mark PO as delivered
   */
  async markDelivered(poId) {
    const po = await this.getPOById(poId);

    if (po.status !== 'shipped') {
      throw new ValidationError(`Hanya PO dengan status 'shipped' yang bisa di-deliver`);
    }

    await knex('po_orders')
      .where('id', poId)
      .update({
        status: 'delivered',
        deliveredAt: new Date(),
      });

    await inventoryService.logInventoryChange(
      po.productId,
      po.quantity,
      'po_delivered',
      `PO ${poId} diterima customer (${po.quantity} unit)`,
      poId,
      'po_order'
    );

    return this.getPOById(poId);
  }

  /**
   * Get PO statistics
   */
  async getPOStats() {
    const [totalPO, pendingPO, confirmedPO, shippedPO, deliveredPO, cancelledPO] = await Promise.all([
      knex('po_orders').count('* as count').first().then(r => r.count || 0),
      knex('po_orders').where('status', 'pending').count('* as count').first().then(r => r.count || 0),
      knex('po_orders').where('status', 'confirmed').count('* as count').first().then(r => r.count || 0),
      knex('po_orders').where('status', 'shipped').count('* as count').first().then(r => r.count || 0),
      knex('po_orders').where('status', 'delivered').count('* as count').first().then(r => r.count || 0),
      knex('po_orders').where('status', 'cancelled').count('* as count').first().then(r => r.count || 0),
    ]);

    const totalRevenue = await knex('po_orders')
      .where('status', 'delivered')
      .sum('totalPrice as sum')
      .first()
      .then(r => r.sum || 0);

    return {
      total: totalPO,
      byStatus: {
        pending: pendingPO,
        confirmed: confirmedPO,
        shipped: shippedPO,
        delivered: deliveredPO,
        cancelled: cancelledPO,
      },
      revenue: {
        total: totalRevenue,
        currency: 'IDR',
      },
    };
  }
}

module.exports = new POService();

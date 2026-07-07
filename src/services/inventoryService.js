// src/services/inventoryService.js
/**
 * Inventory Service
 * Handles inventory management, stock tracking, and inventory logs
 */

const knex = require('../config/knex');
const { ValidationError, NotFoundError } = require('../utils/errors');
const activityService = require('./activityService');

class InventoryService {
  /**
   * Log inventory change ke tabel inventory_log
   * @param {String} productId - Product ID
   * @param {Number} change - Perubahan stok (bisa positif atau negatif)
   * @param {String} type - Tipe perubahan: stock_in, sale, po_confirmed, po_cancelled, adjustment, return
   * @param {String} reason - Alasan perubahan
   * @param {Number} referenceId - ID dari order/PO/etc
   * @param {String} referenceType - Tipe reference: order, po_order, manual_adjustment
   * @param {String} changedBy - User ID yang melakukan perubahan
   */
  async logInventoryChange(productId, change, type, reason = '', referenceId = null, referenceType = null, changedBy = null) {
    try {
      // Get current stock
      const product = await knex('product')
        .select('readyStock', 'stockQuantity')
        .where('id', productId)
        .first();

      if (!product) {
        throw new NotFoundError('Produk tidak ditemukan');
      }

      const stockBefore = product.readyStock || 0;
      const stockAfter = stockBefore + change;

      // Insert log
      await knex('inventory_log').insert({
        productId,
        change,
        type,
        reason,
        referenceId,
        referenceType,
        changedBy,
        stockBefore,
        stockAfter,
        createdAt: new Date(),
      });

      // Also log to system activity
      const actionMap = {
        'stock_in': 'Restock Produk',
        'sale': 'Stok Terjual',
        'adjustment': 'Penyesuaian Stok',
        'return': 'Pengembalian Stok'
      };
      
      const actionName = actionMap[type] || 'Perubahan Stok';
      const actionDetails = `${reason || actionName} (Perubahan: ${change > 0 ? '+' : ''}${change}, Sisa: ${stockAfter})`;
      
      await activityService.logActivity({
        userId: changedBy,
        action: actionName,
        details: actionDetails,
        entityType: 'PRODUCT',
        entityId: productId
      });

      return true;
    } catch (error) {
      console.error('Error logging inventory change:', error);
      // Don't throw, just log. Jangan break PO flow jika log gagal
      return false;
    }
  }

  /**
   * Update stock produk
   * @param {String} productId - Product ID
   * @param {Number} quantity - Jumlah baru untuk readyStock
   */
  async updateStock(productId, quantity) {
    if (quantity < 0) {
      throw new ValidationError('Stok tidak boleh negatif');
    }

    const product = await knex('product')
      .select('readyStock')
      .where('id', productId)
      .first();

    if (!product) {
      throw new NotFoundError('Produk tidak ditemukan');
    }

    const oldStock = product.readyStock || 0;
    const change = quantity - oldStock;

    // Update product table
    await knex('product')
      .where('id', productId)
      .update({
        readyStock: quantity,
        stockQuantity: quantity, // Keep stockQuantity in sync
      });

    // Log the change
    await this.logInventoryChange(
      productId,
      change,
      'adjustment',
      'Manual stock adjustment',
      null,
      'manual_adjustment'
    );

    return { productId, oldStock, newStock: quantity, change };
  }

  /**
   * Deduct stock ketika order confirmed
   * @param {String} productId - Product ID
   * @param {Number} quantity - Jumlah yang dipesan
   * @param {Number} orderId - Order ID
   */
  async deductStockForOrder(productId, quantity, orderId) {
    const product = await knex('product')
      .select('readyStock', 'trackStock')
      .where('id', productId)
      .first();

    if (!product) {
      throw new NotFoundError('Produk tidak ditemukan');
    }

    if (product.trackStock === 0 || product.trackStock === false) {
      return { productId, soldQuantity: quantity, remainingStock: 'UNLIMITED (Bypass)' };
    }

    const currentStock = product.readyStock || 0;

    if (currentStock < quantity) {
      throw new ValidationError(
        `Stok tidak cukup. Tersedia: ${currentStock}, diminta: ${quantity}`
      );
    }

    const newStock = currentStock - quantity;

    // Update stock
    await knex('product')
      .where('id', productId)
      .update({
        readyStock: newStock,
        stockQuantity: newStock,
      });

    // Log
    await this.logInventoryChange(
      productId,
      -quantity,
      'sale',
      `Order ${orderId} confirmed`,
      orderId,
      'order'
    );

    return { productId, soldQuantity: quantity, remainingStock: newStock };
  }

  /**
   * Add stock (restock)
   * @param {String} productId - Product ID
   * @param {Number} quantity - Jumlah restock
   * @param {String} reason - Alasan restock
   */
  async restockProduct(productId, quantity, reason = 'Restock') {
    if (quantity <= 0) {
      throw new ValidationError('Jumlah restock harus lebih dari 0');
    }

    const product = await knex('product')
      .select('readyStock')
      .where('id', productId)
      .first();

    if (!product) {
      throw new NotFoundError('Produk tidak ditemukan');
    }

    const currentStock = product.readyStock || 0;
    const newStock = currentStock + quantity;

    // Update stock
    await knex('product')
      .where('id', productId)
      .update({
        readyStock: newStock,
        stockQuantity: newStock,
      });

    // Log
    await this.logInventoryChange(
      productId,
      quantity,
      'stock_in',
      reason,
      null,
      'manual_adjustment'
    );

    return { productId, addedQuantity: quantity, newStock };
  }

  /**
   * Get inventory status untuk semua produk
   * @param {Object} filters - { category, search }
   */
  async getInventoryStatus(filters = {}) {
    const { category, search, featured } = filters;

    let query = knex('product').select(
      'id',
      'sku',
      'productName',
      'price',
      'category',
      'stockQuantity',
      'readyStock',
      'stockType',
      'featured',
      'imageUrl',
      'businessType'
    );

    if (category) query = query.where('category', category);
    if (search) query = query.where('productName', 'like', `%${search}%`);
    if (featured !== undefined) query = query.where('featured', featured);

    const products = await query.orderBy('category', 'asc').orderBy('productName', 'asc');

    // Tambahkan PO count per product
    const enriched = await Promise.all(
      products.map(async (product) => {
        const poCount = await knex('po_orders')
          .where('productId', product.id)
          .whereIn('status', ['pending', 'confirmed'])
          .count('* as count')
          .first()
          .then(r => r.count || 0);

        const poQuantity = await knex('po_orders')
          .where('productId', product.id)
          .whereIn('status', ['pending', 'confirmed'])
          .sum('quantity as total')
          .first()
          .then(r => r.total || 0);

        return {
          ...product,
          poCount,
          poQuantity,
          lowStock: product.stockQuantity < 10,
        };
      })
    );

    return enriched;
  }

  /**
   * Get inventory log history
   * @param {Object} filters - { productId, type, startDate, endDate, limit, page }
   */
  async getInventoryLog(filters = {}) {
    const { productId, type, startDate, endDate, limit = 50, page = 1 } = filters;

    let query = knex('inventory_log');

    if (productId) query = query.where('productId', productId);
    if (type) query = query.where('type', type);
    if (startDate) query = query.where('createdAt', '>=', startDate);
    if (endDate) query = query.where('createdAt', '<=', endDate);

    const total = await query.clone().count('* as count').first().then(r => r.count);
    const offset = (page - 1) * limit;

    const logs = await query
      .select('*')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);

    // Get product info untuk setiap log
    const enriched = await Promise.all(
      logs.map(async (log) => {
        const product = await knex('product')
          .select('id', 'productName', 'imageUrl')
          .where('id', log.productId)
          .first();

        return { ...log, product };
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
   * Get inventory analytics
   */
  async getInventoryAnalytics() {
    // Total stok (sum of all items), exclude untracked or Bawa Sendiri
    const totalStock = await knex('product')
      .where('isActive', true)
      .where(function() {
        this.where('trackStock', 1).orWhere('trackStock', true);
      })
      .whereNot('productName', 'like', '%Bawa Sendiri%')
      .sum('stockQuantity as total')
      .first()
      .then(r => r.total || 0);

    // Low stock products (count of product types), exclude untracked or Bawa Sendiri
    const lowStockProducts = await knex('product')
      .where('isActive', true)
      .where('stockQuantity', '<', 10)
      .where(function() {
        this.where('trackStock', 1).orWhere('trackStock', true);
      })
      .whereNot('productName', 'like', '%Bawa Sendiri%')
      .count('* as count')
      .first()
      .then(r => r.count || 0);

    const byCategory = await knex('product')
      .where('isActive', true)
      .select('categoryId as category')
      .sum('stockQuantity as stock')
      .count('* as productCount')
      .groupBy('categoryId');

    // PO statistics
    const poStats = await knex('po_orders')
      .select('status')
      .count('* as count')
      .groupBy('status');

    const totalPOQuantity = await knex('po_orders')
      .whereIn('status', ['pending', 'confirmed'])
      .sum('quantity as total')
      .first()
      .then(r => r.total || 0);

    return {
      inventory: {
        totalStock,
        lowStockProducts,
      },
      byCategory,
      poOrders: {
        stats: poStats,
        pendingQuantity: totalPOQuantity,
      },
    };
  }
}

module.exports = new InventoryService();

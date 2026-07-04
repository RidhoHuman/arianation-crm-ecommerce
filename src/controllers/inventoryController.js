// src/controllers/inventoryController.js
/**
 * Inventory Controller
 * Handles inventory management endpoints
 */

const inventoryService = require('../services/inventoryService');
const { sendSuccess, sendPaginated } = require('../utils/response');

/**
 * Get inventory status
 * GET /api/admin/inventory
 * Query: ?category=supporter&search=kaos&featured=true
 */
const getInventoryStatus = async (req, res, next) => {
  try {
    const { category, search, featured } = req.query;

    const inventory = await inventoryService.getInventoryStatus({
      category,
      search,
      featured: featured !== undefined ? featured === 'true' : undefined,
    });

    sendSuccess(res, inventory, 'Status inventory');
  } catch (error) {
    next(error);
  }
};

/**
 * Update product stock
 * PATCH /api/admin/inventory/:productId/stock
 * Body: { quantity }
 */
const updateStock = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const result = await inventoryService.updateStock(productId, quantity);

    sendSuccess(res, result, 'Stok produk diupdate');
  } catch (error) {
    next(error);
  }
};

/**
 * Restock product
 * POST /api/admin/inventory/:productId/restock
 * Body: { quantity, reason? }
 */
const restockProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity, reason } = req.body;

    const result = await inventoryService.restockProduct(productId, quantity, reason);

    sendSuccess(res, result, 'Produk di-restock');
  } catch (error) {
    next(error);
  }
};

/**
 * Get inventory log/history
 * GET /api/admin/inventory/log
 * Query: ?productId=xxx&type=sale&page=1&limit=50
 */
const getInventoryLog = async (req, res, next) => {
  try {
    const { productId, type, startDate, endDate, page, limit } = req.query;

    const result = await inventoryService.getInventoryLog({
      productId,
      type,
      startDate,
      endDate,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
    });

    sendPaginated(res, result.data, result.pagination, 'Inventory log');
  } catch (error) {
    next(error);
  }
};

/**
 * Get inventory analytics
 * GET /api/admin/inventory/analytics
 */
const getInventoryAnalytics = async (req, res, next) => {
  try {
    const analytics = await inventoryService.getInventoryAnalytics();
    sendSuccess(res, analytics, 'Analytics inventory');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventoryStatus,
  updateStock,
  restockProduct,
  getInventoryLog,
  getInventoryAnalytics,
};

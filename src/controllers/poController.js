// src/controllers/poController.js
/**
 * Pre-Order Controller
 * Handles HTTP requests untuk PO system
 */

const poService = require('../services/poService');
const { sendSuccess, sendCreated, sendPaginated, sendError } = require('../utils/response');
const { MESSAGES } = require('../utils/constants');

/**
 * Create a pre-order
 * POST /api/po/create
 * Body: { productId, quantity, pricePerUnit }
 */
const createPO = async (req, res, next) => {
  try {
    const { productId, quantity, pricePerUnit } = req.body;
    const customerId = req.user?.id; // From auth middleware

    const po = await poService.createPO({
      productId,
      quantity,
      customerId,
      pricePerUnit,
    });

    sendCreated(res, po, 'Pre-order berhasil dibuat');
  } catch (error) {
    next(error);
  }
};

/**
 * Get single PO
 * GET /api/po/:id
 */
const getPO = async (req, res, next) => {
  try {
    const { id } = req.params;
    const po = await poService.getPOById(id);
    sendSuccess(res, po, 'Data pre-order');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all POs (admin)
 * GET /api/admin/po
 * Query: ?status=pending&productId=xxx&page=1&limit=20
 */
const getAllPOs = async (req, res, next) => {
  try {
    const { status, productId, customerId, page, limit } = req.query;

    const result = await poService.getAllPOs({
      status,
      productId,
      customerId,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });

    sendPaginated(res, result.data, result.pagination, 'Daftar pre-order');
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm PO (admin)
 * PATCH /api/admin/po/:id/confirm
 * Body: { expectedDelivery?, notes? }
 */
const confirmPO = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { expectedDelivery, notes } = req.body;

    const po = await poService.confirmPO(id, { expectedDelivery, notes });

    sendSuccess(res, po, 'Pre-order dikonfirmasi');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark PO as shipped (admin)
 * PATCH /api/admin/po/:id/ship
 * Body: { trackingNumber? }
 */
const shipPO = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { trackingNumber } = req.body;

    const po = await poService.markShipped(id, trackingNumber);

    sendSuccess(res, po, 'Pre-order dikirim');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark PO as delivered (admin)
 * PATCH /api/admin/po/:id/deliver
 */
const deliverPO = async (req, res, next) => {
  try {
    const { id } = req.params;
    const po = await poService.markDelivered(id);
    sendSuccess(res, po, 'Pre-order diterima');
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel PO
 * PATCH /api/admin/po/:id/cancel
 * Body: { reason? }
 */
const cancelPO = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const po = await poService.cancelPO(id, reason);

    sendSuccess(res, po, 'Pre-order dibatalkan');
  } catch (error) {
    next(error);
  }
};

/**
 * Get PO statistics
 * GET /api/admin/po/stats
 */
const getPOStats = async (req, res, next) => {
  try {
    const stats = await poService.getPOStats();
    sendSuccess(res, stats, 'Statistik pre-order');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPO,
  getPO,
  getAllPOs,
  confirmPO,
  shipPO,
  deliverPO,
  cancelPO,
  getPOStats,
};

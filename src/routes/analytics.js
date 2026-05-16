// src/routes/analytics.js

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const { authenticate, authorize } = require('../middleware/auth');

// All analytics endpoints require OWNER/ADMIN role
router.use(authenticate);
router.use(authorize(['OWNER', 'ADMIN']));

/**
 * GET /api/analytics/fulfillment
 * Get fulfillment analytics dashboard
 * Query: ?dateFrom=2026-05-01&dateTo=2026-05-31
 */
router.get('/fulfillment', async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const analytics = await analyticsService.getFulfillmentAnalytics({
      dateFrom,
      dateTo,
    });

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/performance
 * Get fulfillment performance metrics
 * Query: ?dateFrom=2026-05-01&dateTo=2026-05-31
 */
router.get('/performance', async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const performance = await analyticsService.getFulfillmentPerformance({
      dateFrom,
      dateTo,
    });

    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/revenue
 * Get revenue analytics
 * Query: ?dateFrom=2026-05-01&dateTo=2026-05-31&groupBy=day
 */
router.get('/revenue', async (req, res, next) => {
  try {
    const { dateFrom, dateTo, groupBy } = req.query;

    const revenue = await analyticsService.getRevenueAnalytics({
      dateFrom,
      dateTo,
      groupBy: groupBy || 'day',
    });

    res.json({
      success: true,
      data: revenue,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

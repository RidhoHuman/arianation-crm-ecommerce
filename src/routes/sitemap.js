// src/routes/sitemap.js

const express = require('express');
const router = express.Router();
const {
  getProductsSitemap,
  getCategoriesSitemap,
  getSitemapIndex,
} = require('../controllers/sitemapController');

// Sitemap endpoints - no authentication required
router.get('/sitemap.xml', getSitemapIndex);
router.get('/sitemap/products.xml', getProductsSitemap);
router.get('/sitemap/categories.xml', getCategoriesSitemap);

module.exports = router;

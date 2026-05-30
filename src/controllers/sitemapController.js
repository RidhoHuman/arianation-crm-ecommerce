// src/controllers/sitemapController.js

const knex = require('../config/knex');
const { sendSuccess } = require('../utils/response');

/**
 * Generate XML sitemap untuk semua products
 * Used by Google Search Console dan crawlers
 * Route: GET /api/sitemap/products.xml
 */
const getProductsSitemap = async (req, res, next) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://arianation.com';

    // Fetch all active products from database
    const products = await knex('product')
      .select('id', 'productName', 'updatedAt', 'isActive')
      .where('isActive', true)
      .orderBy('updatedAt', 'desc');

    // Build XML sitemap
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    products.forEach((product) => {
      const lastmod = product.updatedAt ? product.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const productUrl = `${baseUrl}/products/${product.id}`;
      const productName = product.productName
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      xml += '  <url>\n';
      xml += `    <loc>${productUrl}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    // Return as XML
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (error) {
    next(error);
  }
};

/**
 * Generate XML sitemap untuk categories
 * Route: GET /api/sitemap/categories.xml
 */
const getCategoriesSitemap = async (req, res, next) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://arianation.com';

    // Fetch all active categories
    const categories = await knex('productCategory')
      .select('id', 'categoryName', 'updatedAt')
      .where('isActive', true)
      .orderBy('categoryName');

    // Build XML sitemap
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    categories.forEach((category) => {
      const lastmod = category.updatedAt ? category.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const categoryUrl = `${baseUrl}/products?category=${category.id}`;

      xml += '  <url>\n';
      xml += `    <loc>${categoryUrl}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (error) {
    next(error);
  }
};

/**
 * Main sitemap index yang reference ke semua sitemap files
 * Route: GET /api/sitemap.xml
 */
const getSitemapIndex = async (req, res, next) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://arianation.com';

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += `  <sitemap>\n`;
    xml += `    <loc>${baseUrl}/sitemap.xml</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += `  </sitemap>\n`;
    xml += `  <sitemap>\n`;
    xml += `    <loc>${baseUrl}/api/sitemap/products.xml</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += `  </sitemap>\n`;
    xml += `  <sitemap>\n`;
    xml += `    <loc>${baseUrl}/api/sitemap/categories.xml</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += `  </sitemap>\n`;
    xml += '</sitemapindex>';

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProductsSitemap,
  getCategoriesSitemap,
  getSitemapIndex,
};

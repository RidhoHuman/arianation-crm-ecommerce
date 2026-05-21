// api/index.js - Main API handler routed by vercel.json

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

let app;

try {
  app = require('../src/app');
} catch (error) {
  console.error('[API/INDEX ERROR]', error.message);
  app = null;
}

module.exports = (req, res) => {
  if (!app) {
    return res.status(500).json({
      success: false,
      message: 'Application failed to load'
    });
  }
  
  // Ensure Express receives the full original URL for proper routing
  // Vercel's routes config passes the full /api/... path to this handler
  // req.url should already be correct, but verify it's set
  if (!req.url || req.url === '/') {
    req.url = req.originalUrl || '/api';
  }
  
  app(req, res);
};

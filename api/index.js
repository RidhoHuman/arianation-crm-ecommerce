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
  
  app(req, res);
};

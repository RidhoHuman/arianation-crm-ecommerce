// api/cart/[...slug].js - Handle cart routes

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

let app;
try {
  app = require('../../src/app');
} catch (error) {
  console.error('[CART HANDLER ERROR]', error.message);
  app = null;
}

module.exports = (req, res) => {
  if (!app) return res.status(500).json({ success: false, message: 'App failed to load' });
  app(req, res);
};

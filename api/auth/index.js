if (process.env.NODE_ENV !== 'production') require('dotenv').config();
let app;
try {
  app = require('../../src/app');
} catch (error) {
  console.error('[HANDLER ERROR]', error.message);
}
module.exports = (req, res) => {
  if (!app) return res.status(500).json({ success: false, message: 'App failed to load' });
  app(req, res);
};


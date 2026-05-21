if (process.env.NODE_ENV !== 'production') require('dotenv').config();
let app;
try {
  app = require('../../src/app');
} catch (error) {
  console.error('[HANDLER ERROR]', error.message);
}
module.exports = (req, res) => {
  console.log('[AUTH/INDEX]', {
    url: req.url,
    path: req.path,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    method: req.method
  });
  
  if (!app) return res.status(500).json({ success: false, message: 'App failed to load' });
  
  // Ensure path is set correctly for Express routing
  if (!req.path || req.path === '/') {
    const url = req.originalUrl || req.url || '/api/auth/login';
    req.url = url;
  }
  
  app(req, res);
};


// api/auth/[...slug].js - Handle auth routes

// Only load .env in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

let app;

try {
  app = require('../../src/app');
} catch (error) {
  console.error('[AUTH HANDLER ERROR]', error.message);
  app = null;
}

// Export handler function for Vercel
module.exports = (req, res) => {
  if (!app) {
    return res.status(500).json({
      success: false,
      message: 'App failed to load',
    });
  }

  console.log('[AUTH ROUTE]', {
    method: req.method,
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl,
  });

  // Delegate to Express app
  app(req, res);
};

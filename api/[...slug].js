// api/[...slug].js - Catch-all handler for all API routes
// This allows Express app to handle all /api/* routes

// Only load .env in development, not in production (Vercel)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

let app;
try {
  app = require('../src/app');
  console.log('✅ App loaded successfully');
} catch (error) {
  console.error('❌ Failed to load app:', error.message);
  console.error(error.stack);
  app = null;
}

// Export handler function for Vercel
module.exports = (req, res) => {
  // If app failed to load, return error
  if (!app) {
    console.error('⚠️  App is null');
    return res.status(500).json({
      success: false,
      message: 'Application failed to initialize',
    });
  }

  try {
    // Call Express app as middleware/request handler
    app(req, res);
  } catch (error) {
    console.error('Request handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};


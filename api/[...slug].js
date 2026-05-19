// api/[...slug].js - Catch-all handler for all API routes
// This allows Express app to handle all /api/* routes

// Only load .env in development, not in production (Vercel)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

let app;
try {
  app = require('../src/app');
} catch (error) {
  console.error('Failed to load app:', error.message);
  console.error('Stack:', error.stack);
  module.exports = (req, res) => {
    res.status(500).json({
      success: false,
      message: 'Failed to load application',
      error: error.message,
    });
  };
}

module.exports = (req, res) => {
  try {
    return app(req, res);
  } catch (error) {
    console.error('Request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};


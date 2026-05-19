// api/[...slug].js - Catch-all handler for all API routes

// Only load .env in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

let app;
let appLoadError = null;

try {
  console.log('Loading app...');
  app = require('../src/app');
  console.log('App loaded OK');
} catch (error) {
  appLoadError = error;
  console.log('App load failed:', error.message);
  console.log('Error type:', error.constructor.name);
  console.log('Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
  app = null;
}

// Export handler function
module.exports = (req, res) => {
  if (!app) {
    console.log('Returning error - app is null');
    console.log('appLoadError:', appLoadError?.message);
    return res.status(500).json({
      success: false,
      message: 'Application failed to load',
      error: appLoadError?.message || 'Unknown error',
    });
  }

  try {
    // Wrap request/response to capture errors
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      if (data && data.message && data.message.includes('ValidationError')) {
        console.log('[VALIDATION ERROR]', data.message, data.errors);
      }
      return originalJson(data);
    };

    app(req, res);
  } catch (error) {
    console.log('[HANDLER ERROR]', error.message);
    console.log('[ERROR STACK]', error.stack);
    res.status(500).json({
      success: false,
      message: 'Request failed',
      error: error.message,
    });
  }
};


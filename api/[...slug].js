// api/[...slug].js - Catch-all handler for all API routes


// Only load .env in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

let app;
let appLoadError = null;

console.log('[API HANDLER] NODE_ENV:', process.env.NODE_ENV);
console.log('[API HANDLER] Loading app...');

try {
  app = require('../src/app');
  console.log('[API HANDLER] App loaded successfully');
} catch (error) {
  appLoadError = error;
  console.log('[APP LOAD ERROR] Message:', error.message);
  console.log('[APP LOAD ERROR] Name:', error.name);
  console.log('[APP LOAD ERROR] Code:', error.code);
  if (error.stack) {
    console.log('[APP LOAD ERROR] Stack:', error.stack.split('\n').slice(0, 10).join('\n'));
  }
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
    // Debug logging
    console.log('[REQUEST]', {
      method: req.method,
      path: req.path,
      url: req.url,
      query: req.query,
      originalUrl: req.originalUrl,
    });

    // Wrap request/response to capture errors
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      if (data && data.message && data.message.includes('ValidationError')) {
        console.log('[VALIDATION ERROR]', data.message, data.errors);
      }
      return originalJson(data);
    };

    // Wrap end to capture response
    const originalEnd = res.end.bind(res);
    res.end = function(...args) {
      console.log('[RESPONSE]', {
        statusCode: res.statusCode,
        method: req.method,
        path: req.path,
      });
      return originalEnd(...args);
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


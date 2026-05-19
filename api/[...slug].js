// api/[...slug].js - Catch-all handler for all API routes
// This allows Express app to handle all /api/* routes

require('dotenv').config();

const app = require('../src/app');

module.exports = (req, res) => {
  return app(req, res);
};

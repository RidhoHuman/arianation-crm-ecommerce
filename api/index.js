// Vercel serverless entry point - proper handler for Express
// This file exports the Express app as a serverless function handler

require('dotenv').config();

const app = require('../src/app');

// For Vercel, we export the app directly
// Vercel's runtime will wrap it as needed
module.exports = app;

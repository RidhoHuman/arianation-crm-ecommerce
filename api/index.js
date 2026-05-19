// Vercel serverless entry point
// This exports the Express app without calling .listen()

require('dotenv').config();

const app = require('../src/app');

module.exports = app;

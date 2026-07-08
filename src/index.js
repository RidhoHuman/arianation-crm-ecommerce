// src/index.js - Local development entry point only
// For production (Vercel), use api/[...slug].js instead

// Only load .env in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const knex = require('./config/knex');
const app = require('./app');
const cronService = require('./services/cronService');

const PORT = process.env.PORT || 3001;

// Skip database check on production (serverless)
const startServer = async () => {
  try {
    // Only test DB connection in development
    if (process.env.NODE_ENV !== 'production') {
      await knex.raw('SELECT 1');
      console.log('✅ Database connection successful');
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🗄️  Database: arianation_db\n`);
      
      // Initialize Background Cron Jobs
      cronService.initCronJobs();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

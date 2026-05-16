// src/index.js

require('dotenv').config();
const prisma = require('./config/database');
const app = require('./app');

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🗄️  Database: arianation_db\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

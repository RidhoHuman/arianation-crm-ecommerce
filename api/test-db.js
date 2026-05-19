// api/test-db.js - Simple test to check database connectivity
require('dotenv').config({
  override: true,
});

module.exports = async (req, res) => {
  try {
    console.log('[TEST-DB] NODE_ENV:', process.env.NODE_ENV);
    console.log('[TEST-DB] Has DATABASE_URL:', !!process.env.DATABASE_URL);

    const prisma = require('../src/config/database');

    console.log('[TEST-DB] Testing database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('[TEST-DB] Connection successful!', result);

    return res.status(200).json({
      success: true,
      message: 'Database connected successfully',
      result,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
      },
    });
  } catch (error) {
    console.log('[TEST-DB] ERROR:', error.message);
    console.log('[TEST-DB] ERROR CODE:', error.code);
    console.log('[TEST-DB] ERROR STACK:', error.stack.split('\n').slice(0, 5).join('\n'));

    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      code: error.code,
    });
  }
};

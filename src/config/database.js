// src/config/database.js

const { PrismaClient } = require('@prisma/client');
const { monitorResources } = require('../../debug-resources');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'], // Only log errors
  errorFormat: 'pretty',
  __internal: {
    debug: false,
  },
});

// Monitor resources every 30 seconds during development (less verbose)
let monitorInterval;
if (process.env.NODE_ENV === 'development') {
  monitorInterval = setInterval(() => {
    monitorResources();
  }, 30000); // Changed from 10s to 30s

  // Clean up interval on exit
  process.on('exit', () => {
    if (monitorInterval) clearInterval(monitorInterval);
  });
}

// Handle graceful shutdown - PREVENT MEMORY LEAK
process.on('SIGINT', async () => {
  console.log('🔴 SIGINT: Disconnecting Prisma Client...');
  if (monitorInterval) clearInterval(monitorInterval);
  await prisma.$disconnect().catch(err => {
    console.error('Error during Prisma disconnect:', err);
  });
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔴 SIGTERM: Disconnecting Prisma Client...');
  if (monitorInterval) clearInterval(monitorInterval);
  await prisma.$disconnect().catch(err => {
    console.error('Error during Prisma disconnect:', err);
  });
  process.exit(0);
});

// Also handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('💥 Uncaught Exception:', error);
  if (monitorInterval) clearInterval(monitorInterval);
  await prisma.$disconnect().catch(err => {
    console.error('Error during Prisma disconnect:', err);
  });
  process.exit(1);
});

module.exports = prisma;

const { PrismaClient } = require('@prisma/client');

console.log('Testing Prisma connection...\n');
console.log('DATABASE_URL:', process.env.DATABASE_URL || 'NOT FOUND');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT NOW() as current_time;`;
    console.log('\n✅ Prisma connection SUCCESS!');
    console.log('Current time:', result[0].current_time);
  } catch (error) {
    console.error('\n❌ Prisma connection FAILED!');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
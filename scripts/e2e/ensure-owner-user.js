#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'owner@arianation.com';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || 'owner123';
const OWNER_FULL_NAME = process.env.OWNER_FULL_NAME || 'Owner Arianation';

async function main() {
  const hashedPassword = await bcrypt.hash(OWNER_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: {
      password: hashedPassword,
      fullName: OWNER_FULL_NAME,
      role: 'OWNER',
      isActive: true,
      emailVerified: new Date(),
    },
    create: {
      email: OWNER_EMAIL,
      password: hashedPassword,
      fullName: OWNER_FULL_NAME,
      role: 'OWNER',
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log(`✅ Ensured OWNER user exists: ${user.email}`);
}

main()
  .catch((error) => {
    console.error('❌ Failed to ensure owner user:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

#!/usr/bin/env node

const knex = require('../../src/config/knex');
const bcrypt = require('bcryptjs');

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'owner@arianation.com';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || 'owner123';
const OWNER_FULL_NAME = process.env.OWNER_FULL_NAME || 'Owner Arianation';

async function main() {
  const hashedPassword = await bcrypt.hash(OWNER_PASSWORD, 10);

  const existing = await knex('user').where('email', OWNER_EMAIL).first();

  if (existing) {
    await knex('user').where('email', OWNER_EMAIL).update({
      password: hashedPassword,
      fullName: OWNER_FULL_NAME,
      role: 'OWNER',
      isActive: true,
      emailVerified: true,
      updatedAt: new Date()
    });
  } else {
    await knex('user').insert({
      id: require('cuid')(),
      email: OWNER_EMAIL,
      password: hashedPassword,
      fullName: OWNER_FULL_NAME,
      role: 'OWNER',
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  console.log(`✅ Ensured OWNER user exists: ${OWNER_EMAIL}`);
}

main()
  .catch((error) => {
    console.error('❌ Failed to ensure owner user:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await knex.destroy();
  });

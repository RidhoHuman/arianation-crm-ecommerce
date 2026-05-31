#!/usr/bin/env node
/**
 * Seed production database with sample data
 * Usage: node scripts/seed-production.js
 */

const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load .env
dotenv.config();

const knex = require('knex');

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL;
const isPostgresUrl = DATABASE_URL && /^postgres(ql)?:\/\//i.test(DATABASE_URL);

const db = knex({
  client: DATABASE_URL ? (isPostgresUrl ? 'pg' : 'mysql2') : 'mysql2',
  connection: DATABASE_URL || {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'arianation_user',
    password: process.env.DB_PASSWORD || 'AriaNation@2024',
    database: process.env.DB_NAME || 'arianation_db',
  },
});

async function seedDatabase() {
  try {
    console.log('🌱 Memulai seeding production database...');

    // 1. Seed users
    console.log('\n📝 Seeding users...');
    const users = [
      {
        id: 'owner-001',
        email: 'owner@arianation.com',
        password: await bcrypt.hash('owner123', 10),
        fullName: 'Owner Arianation',
        role: 'OWNER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'admin-001',
        email: 'admin@arianation.com',
        password: await bcrypt.hash('admin123', 10),
        fullName: 'Admin Staff',
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'customer-001',
        email: 'customer1@example.com',
        password: await bcrypt.hash('password123', 10),
        fullName: 'Customer One',
        role: 'CUSTOMER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'customer-002',
        email: 'customer2@example.com',
        password: await bcrypt.hash('password123', 10),
        fullName: 'Customer Two',
        role: 'CUSTOMER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Check if users exist
    const existingUsers = await db('user').where('role', 'OWNER').first();
    if (!existingUsers) {
      await db('user').insert(users);
      console.log(`✅ ${users.length} users created`);
    } else {
      console.log('⏭️  Users sudah ada, skip seeding');
    }

    // 2. Seed categories
    console.log('\n📝 Seeding product categories...');
    const categories = [
      {
        id: 'cat-001',
        categoryName: 'Casual T-Shirt',
        businessType: 'retail',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat-002',
        categoryName: 'Hoodie',
        businessType: 'retail',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat-003',
        categoryName: 'Custom Design',
        businessType: 'service',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const existingCategories = await db('productCategory').first();
    if (!existingCategories) {
      await db('productCategory').insert(categories);
      console.log(`✅ ${categories.length} categories created`);
    } else {
      console.log('⏭️  Categories sudah ada, skip seeding');
    }

    // 3. Seed products
    console.log('\n📝 Seeding products...');
    const products = [
      {
        id: 'prod-001',
        categoryId: 'cat-001',
        productName: 'Basic White T-Shirt',
        price: 99000,
        stockQuantity: 100,
        productType: 'casual',
        businessType: 'retail',
        description: 'Comfortable and versatile white t-shirt for everyday wear',
        imageUrl: '/products/default.jpg',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'prod-002',
        categoryId: 'cat-001',
        productName: 'Black Printed T-Shirt',
        price: 129000,
        stockQuantity: 80,
        productType: 'casual',
        businessType: 'retail',
        description: 'Black t-shirt with custom print design',
        imageUrl: '/products/default.jpg',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'prod-003',
        categoryId: 'cat-002',
        productName: 'Grey Hoodie',
        price: 249000,
        stockQuantity: 50,
        productType: 'casual',
        businessType: 'retail',
        description: 'Premium grey hoodie with comfortable fit',
        imageUrl: '/products/default.jpg',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'prod-004',
        categoryId: 'cat-002',
        productName: 'Black Hoodie',
        price: 249000,
        stockQuantity: 60,
        productType: 'casual',
        businessType: 'retail',
        description: 'Classic black hoodie perfect for all seasons',
        imageUrl: '/products/default.jpg',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'prod-005',
        categoryId: 'cat-003',
        productName: 'Custom T-Shirt Design Service',
        price: 150000,
        stockQuantity: 999,
        productType: 'custom',
        businessType: 'service',
        description: 'Create your own custom t-shirt design with professional print',
        imageUrl: '/products/default.jpg',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const existingProducts = await db('product').first();
    if (!existingProducts) {
      await db('product').insert(products);
      console.log(`✅ ${products.length} products created`);
    } else {
      console.log('⏭️  Products sudah ada, skip seeding');
    }

    console.log('\n✅ Seeding production database complete!');
    console.log('\n📋 Test Credentials:');
    console.log('  Owner:     owner@arianation.com / owner123');
    console.log('  Admin:     admin@arianation.com / admin123');
    console.log('  Customer:  customer1@example.com / password123');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    console.error(err);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
}

seedDatabase();

// config/database.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log('PostgreSQL connected via Prisma');
    } catch (error) {
        console.error('Prisma connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
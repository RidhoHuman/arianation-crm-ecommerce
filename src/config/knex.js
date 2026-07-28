// src/config/knex.js
const knex = require('knex');
const path = require('path');

// Load environment variables. Use .env.test when running tests.
const dotenv = require('dotenv');
const envFile =
  process.env.NODE_ENV === 'test' ? path.resolve(process.cwd(), '.env.test') : undefined;
if (envFile) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;
const DB_USER = process.env.DB_USER || 'arianation_user';
const DB_PASSWORD = process.env.DB_PASSWORD || 'AriaNation@2024';
const DB_NAME = process.env.DB_NAME || 'arianation_db';
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const isPostgresUrl = typeof DATABASE_URL === 'string' && /^postgres(ql)?:\/\//i.test(DATABASE_URL);

const db = knex({
  client:
    process.env.NODE_ENV === 'test'
      ? 'sqlite3'
      : DATABASE_URL
        ? isPostgresUrl
          ? 'pg'
          : 'mysql2'
        : 'mysql2',
  connection:
    process.env.NODE_ENV === 'test'
      ? {
          filename: process.env.SQLITE_FILE || './db/test.sqlite3',
        }
      : DATABASE_URL
        ? isPostgresUrl
          ? { connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } }
          : DATABASE_URL
        : {
            host: DB_HOST,
            port: DB_PORT,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME,
          },
  useNullAsDefault: process.env.NODE_ENV === 'test',
  pool: {
    min: process.env.NODE_ENV === 'test' ? 0 : 2,
    max: process.env.NODE_ENV === 'test' ? 1 : 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  },
});

// Test koneksi saat startup hanya untuk non-test environment.
if (process.env.NODE_ENV !== 'test') {
  db.raw('SELECT 1')
    .then(() => {
      console.log('✅ Knex berhasil terhubung ke MySQL');
    })
    .catch((err) => {
      console.error('❌ Koneksi Knex ke MySQL gagal:', err.message);
    });
}

module.exports = db;

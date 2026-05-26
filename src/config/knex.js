// src/config/knex.js
const knex = require('knex');

const db = knex({
  client: 'mysql2',
  connection: {
    host: 'localhost',
    port: 3306,
    user: 'arianation_user',
    password: 'AriaNation@2024',
    database: 'arianation_db',
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  },
});

// Test koneksi saat startup
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ Knex berhasil terhubung ke MySQL');
  })
  .catch((err) => {
    console.error('❌ Koneksi Knex ke MySQL gagal:', err.message);
  });

module.exports = db;

const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const knex = require('knex');

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

async function migrate() {
  try {
    const hasColumn = await db.schema.hasColumn('user', 'rewardPoints');
    if (!hasColumn) {
      await db.schema.alterTable('user', (t) => {
        t.integer('rewardPoints').defaultTo(0);
      });
      console.log('✅ Added rewardPoints to user table.');
    } else {
      console.log('⏭️ rewardPoints column already exists.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await db.destroy();
  }
}

migrate();

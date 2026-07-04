require('dotenv').config();
const mysql = require('mysql2/promise');

async function runNotificationsMigration() {
  console.log('🔄 Connecting to database for Admin Notifications migration...');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'arianation_user',
      password: 'AriaNation@2024',
      database: 'arianation_db',
    });

    console.log('✅ Connected to MySQL');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'GENERAL',
        isRead BOOLEAN DEFAULT false,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_isRead (isRead),
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    console.log('Executing CREATE TABLE admin_notifications...');
    await connection.execute(createTableQuery);
    console.log('✅ Table admin_notifications created or already exists.');

    await connection.end();
    console.log('🎉 Admin Notifications migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runNotificationsMigration();

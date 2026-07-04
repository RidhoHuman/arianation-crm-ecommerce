require('dotenv').config();
const mysql = require('mysql2/promise');

async function runNewsletterMigration() {
  console.log('🔄 Connecting to database for Newsletter migration...');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'arianation_user',
      password: 'AriaNation@2024',
      database: 'arianation_db',
    });

    console.log('✅ Connected to MySQL');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        isActive BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_isActive (isActive)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    console.log('Executing CREATE TABLE newsletter_subscribers...');
    await connection.execute(createTableQuery);
    console.log('✅ Table newsletter_subscribers created or already exists.');

    await connection.end();
    console.log('🎉 Newsletter migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runNewsletterMigration();

const mysql = require('mysql2/promise');

async function fixDb() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'arianation_user',
    password: 'AriaNation@2024',
    database: 'arianation_db',
  });
  
  // check schema
  const [rows] = await connection.execute('DESCRIBE `auditLog`');
  console.log(rows);
  
  process.exit(0);
}

fixDb();

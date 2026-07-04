const mysql = require('mysql2/promise');

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'arianation_user',
    password: 'AriaNation@2024',
    database: 'arianation_db',
  });

  console.log('📋 SCHEMA TABEL PRODUCT:\n');
  const [cols] = await connection.execute(`
    SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME='product'
    ORDER BY ORDINAL_POSITION
  `);
  
  cols.forEach(col => {
    console.log(`${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (Nullable: ${col.IS_NULLABLE}, Key: ${col.COLUMN_KEY || 'N/A'})`);
  });

  await connection.end();
}

checkSchema().catch(console.error);

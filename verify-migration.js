// Verify migration hasil
const mysql = require('mysql2/promise');

async function verify() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'arianation_user',
    password: 'AriaNation@2024',
    database: 'arianation_db',
  });

  console.log('📋 VERIFICATION HASIL MIGRATION\n');

  // Check product columns
  console.log('1️⃣ KOLOM BARU DI TABLE PRODUCT:');
  const [productCols] = await connection.execute(`
    SELECT COLUMN_NAME, COLUMN_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME='product' 
    AND COLUMN_NAME IN ('category', 'stockType', 'readyStock', 'articleTitle', 'articleDescription', 'featured')
  `);
  
  if (productCols.length > 0) {
    productCols.forEach(col => {
      console.log(`   ✅ ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
    });
  } else {
    console.log('   ❌ Kolom tidak ditemukan!');
  }

  // Check new tables
  console.log('\n2️⃣ TABEL-TABEL BARU:');
  const newTables = ['po_orders', 'inventory_log', 'category_articles'];
  
  for (const table of newTables) {
    const [result] = await connection.execute(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME='${table}' AND TABLE_SCHEMA='arianation_db'
    `);
    
    if (result[0].count > 0) {
      console.log(`   ✅ ${table}: EXISTS`);
    } else {
      console.log(`   ❌ ${table}: NOT FOUND`);
    }
  }

  // Check category_articles data
  console.log('\n3️⃣ DATA KATEGORI DEFAULT:');
  const [categories] = await connection.execute('SELECT category, title FROM category_articles');
  
  if (categories.length > 0) {
    categories.forEach(cat => {
      console.log(`   ✅ ${cat.category}: ${cat.title}`);
    });
  } else {
    console.log('   ⚠️ Tidak ada kategori default');
  }

  await connection.end();
  console.log('\n✨ Verification complete!');
}

verify().catch(console.error);

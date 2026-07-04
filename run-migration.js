// Run migration dengan parsing yang lebih baik
const mysql = require('mysql2/promise');

const migrations = [
  // Tambah kolom ke product
  `ALTER TABLE product ADD COLUMN category VARCHAR(100) DEFAULT 'casual' COMMENT 'Kategori: supporter, casual, outdoor, fishing'`,
  `ALTER TABLE product ADD COLUMN stockType VARCHAR(50) DEFAULT 'ready' COMMENT 'Tipe stok: ready atau po'`,
  `ALTER TABLE product ADD COLUMN readyStock INT DEFAULT 0 COMMENT 'Jumlah stok siap kirim'`,
  `ALTER TABLE product ADD COLUMN articleTitle VARCHAR(255) COMMENT 'Judul artikel kategori'`,
  `ALTER TABLE product ADD COLUMN articleDescription LONGTEXT COMMENT 'Deskripsi lengkap kategori'`,
  `ALTER TABLE product ADD COLUMN featured BOOLEAN DEFAULT false COMMENT 'Produk featured di kategori'`,
  
  // Add indexes
  `ALTER TABLE product ADD INDEX idx_category (category)`,
  `ALTER TABLE product ADD INDEX idx_stockType (stockType)`,
  `ALTER TABLE product ADD INDEX idx_featured (featured)`,
  
  // Create po_orders table
  `CREATE TABLE IF NOT EXISTS po_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orderId INT UNIQUE COMMENT 'ID order',
    productId VARCHAR(191) NOT NULL COMMENT 'ID produk yang di-PO',
    customerId VARCHAR(191) COMMENT 'ID customer (backup)',
    quantity INT NOT NULL DEFAULT 1 COMMENT 'Jumlah item PO',
    expectedDelivery DATE COMMENT 'Tanggal expected delivery',
    status VARCHAR(50) DEFAULT 'pending' COMMENT 'Status: pending, confirmed, cancelled, shipped, delivered',
    pricePerUnit DECIMAL(12, 2) NOT NULL COMMENT 'Harga per unit saat PO',
    totalPrice DECIMAL(12, 2) NOT NULL COMMENT 'Total harga PO',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmedAt TIMESTAMP NULL COMMENT 'Kapan admin confirm PO',
    shippedAt TIMESTAMP NULL COMMENT 'Kapan produk dikirim',
    deliveredAt TIMESTAMP NULL COMMENT 'Kapan produk diterima',
    cancelledAt TIMESTAMP NULL COMMENT 'Kapan PO dibatalkan',
    notes TEXT COMMENT 'Catatan dari customer atau admin',
    INDEX idx_productId (productId),
    INDEX idx_customerId (customerId),
    INDEX idx_status (status),
    INDEX idx_expectedDelivery (expectedDelivery),
    FOREIGN KEY (productId) REFERENCES product(id) ON DELETE RESTRICT,
    CONSTRAINT chk_po_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'shipped', 'delivered'))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pre-order tracking system'`,
  
  // Create inventory_log table
  `CREATE TABLE IF NOT EXISTS inventory_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    productId VARCHAR(191) NOT NULL COMMENT 'ID produk',
    \`change\` INT NOT NULL COMMENT 'Perubahan stok (positif/negatif)',
    type VARCHAR(100) NOT NULL COMMENT 'Tipe: stock_in, sale, po_confirmed, po_cancelled, adjustment, return',
    reason TEXT COMMENT 'Alasan perubahan stok',
    referenceId INT COMMENT 'ID reference (order, PO, etc)',
    referenceType VARCHAR(50) COMMENT 'Tipe reference: order, po_order, manual_adjustment',
    changedBy VARCHAR(191) COMMENT 'ID user yang buat perubahan',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    stockBefore INT COMMENT 'Stok sebelum perubahan',
    stockAfter INT COMMENT 'Stok setelah perubahan',
    INDEX idx_productId (productId),
    INDEX idx_type (type),
    INDEX idx_createdAt (createdAt),
    FOREIGN KEY (productId) REFERENCES product(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='History log untuk tracking perubahan inventory'`,
  
  // Create category_articles table
  `CREATE TABLE IF NOT EXISTS category_articles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category VARCHAR(100) UNIQUE NOT NULL COMMENT 'Nama kategori',
    title VARCHAR(255) NOT NULL COMMENT 'Judul artikel kategori',
    description LONGTEXT NOT NULL COMMENT 'Deskripsi lengkap kategori',
    heroImage VARCHAR(255) COMMENT 'URL gambar hero',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Article content untuk setiap kategori produk'`,
  
  // Insert kategori default
  `INSERT INTO category_articles (category, title, description) VALUES 
  ('supporter', 'Supporter Culture', 'Koleksi khusus untuk para supporter yang passionate. Produk dirancang dengan detail yang mencerminkan budaya supporter Indonesia.'),
  ('casual', 'Casual Daily', 'Koleksi casual untuk penggunaan sehari-hari. Nyaman, stylish, dan cocok untuk berbagai occasion.'),
  ('outdoor', 'Outdoor Adventure', 'Dirancang untuk petualangan outdoor. Material tahan lama dan desain fungsional untuk aktivitas di alam bebas.'),
  ('fishing', 'Fishing Lifestyle', 'Koleksi khusus untuk para fishing enthusiast. Practical dan stylish untuk hobby memancing Anda.')
  ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description)`,
  
  // Update existing products
  `UPDATE product SET readyStock = stockQuantity WHERE readyStock = 0`,
];

async function runMigrations() {
  console.log('🔄 Connecting to database...');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'arianation_user',
      password: 'AriaNation@2024',
      database: 'arianation_db',
    });

    console.log('✅ Connected to MySQL\n');
    console.log(`📝 Found ${migrations.length} SQL statements to execute\n`);

    for (let i = 0; i < migrations.length; i++) {
      try {
        console.log(`[${i + 1}/${migrations.length}] Executing...`);
        const stmt = migrations[i];
        const preview = stmt.substring(0, 60) + (stmt.length > 60 ? '...' : '');
        console.log(`  ${preview}`);
        
        await connection.execute(stmt);
        console.log('  ✅ Success\n');
      } catch (err) {
        // Skip jika sudah ada (ER_DUP_FIELDNAME, ER_TABLE_EXISTS_ERROR, ER_DUP_KEYNAME)
        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR' || 
            err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_DUP_ENTRY') {
          console.log(`  ⚠️ Skipped (already exists)\n`);
        } else {
          console.log(`  ❌ Error: ${err.message}\n`);
          throw err;
        }
      }
    }

    await connection.end();
    console.log('🎉 All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigrations();

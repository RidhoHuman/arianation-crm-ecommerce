-- ============================================================
-- MIGRATION: Tambah PO System & Inventory Management
-- Created: June 2, 2026
-- Purpose: Support pre-order system dan inventory tracking
-- ============================================================

-- STEP 1: Tambah kolom baru ke tabel product
-- ============================================================
ALTER TABLE product ADD COLUMN category VARCHAR(100) DEFAULT 'casual' COMMENT 'Kategori: supporter, casual, outdoor, fishing';
ALTER TABLE product ADD COLUMN stockType VARCHAR(50) DEFAULT 'ready' COMMENT 'Tipe stok: ready atau po';
ALTER TABLE product ADD COLUMN readyStock INT DEFAULT 0 COMMENT 'Jumlah stok siap kirim';
ALTER TABLE product ADD COLUMN articleTitle VARCHAR(255) COMMENT 'Judul artikel kategori';
ALTER TABLE product ADD COLUMN articleDescription LONGTEXT COMMENT 'Deskripsi lengkap kategori';
ALTER TABLE product ADD COLUMN featured BOOLEAN DEFAULT false COMMENT 'Produk featured di kategori';

-- Index untuk performa query
ALTER TABLE product ADD INDEX idx_category (category);
ALTER TABLE product ADD INDEX idx_stockType (stockType);
ALTER TABLE product ADD INDEX idx_featured (featured);

-- STEP 2: Buat tabel PO Orders (Pre-Order tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS po_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Relationship
  orderId INT UNIQUE COMMENT 'ID order (jika sudah convert ke order actual)',
  productId INT NOT NULL COMMENT 'ID produk yang di-PO',
  customerId INT COMMENT 'ID customer (backup)',
  
  -- Order details
  quantity INT NOT NULL DEFAULT 1 COMMENT 'Jumlah item PO',
  expectedDelivery DATE COMMENT 'Tanggal expected delivery',
  status VARCHAR(50) DEFAULT 'pending' COMMENT 'Status: pending, confirmed, cancelled, shipped, delivered',
  
  -- Pricing
  pricePerUnit DECIMAL(12, 2) NOT NULL COMMENT 'Harga per unit saat PO',
  totalPrice DECIMAL(12, 2) NOT NULL COMMENT 'Total harga PO',
  
  -- Timeline
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmedAt TIMESTAMP NULL COMMENT 'Kapan admin confirm PO',
  shippedAt TIMESTAMP NULL COMMENT 'Kapan produk dikirim',
  deliveredAt TIMESTAMP NULL COMMENT 'Kapan produk diterima',
  cancelledAt TIMESTAMP NULL COMMENT 'Kapan PO dibatalkan',
  
  -- Metadata
  notes TEXT COMMENT 'Catatan dari customer atau admin',
  
  -- Indexes & Constraints
  INDEX idx_productId (productId),
  INDEX idx_customerId (customerId),
  INDEX idx_status (status),
  INDEX idx_expectedDelivery (expectedDelivery),
  FOREIGN KEY (productId) REFERENCES product(id) ON DELETE RESTRICT,
  
  CONSTRAINT chk_po_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'shipped', 'delivered'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pre-order tracking system';

-- STEP 3: Buat tabel Inventory Log (History perubahan stok)
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Relationship
  productId INT NOT NULL COMMENT 'ID produk',
  
  -- Change details
  change INT NOT NULL COMMENT 'Perubahan stok (positif/negatif)',
  type VARCHAR(100) NOT NULL COMMENT 'Tipe: stock_in, sale, po_confirmed, po_cancelled, adjustment, return',
  reason TEXT COMMENT 'Alasan perubahan stok',
  
  -- Reference
  referenceId INT COMMENT 'ID reference (order, PO, etc)',
  referenceType VARCHAR(50) COMMENT 'Tipe reference: order, po_order, manual_adjustment',
  
  -- Who made the change
  changedBy INT COMMENT 'ID user yang buat perubahan',
  
  -- Timeline
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Previous state
  stockBefore INT COMMENT 'Stok sebelum perubahan',
  stockAfter INT COMMENT 'Stok setelah perubahan',
  
  -- Indexes & Constraints
  INDEX idx_productId (productId),
  INDEX idx_type (type),
  INDEX idx_createdAt (createdAt),
  FOREIGN KEY (productId) REFERENCES product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='History log untuk tracking perubahan inventory';

-- STEP 4: Buat tabel Category Articles (Deskripsi kategori)
-- ============================================================
CREATE TABLE IF NOT EXISTS category_articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  category VARCHAR(100) UNIQUE NOT NULL COMMENT 'Nama kategori: supporter, casual, outdoor, fishing',
  title VARCHAR(255) NOT NULL COMMENT 'Judul artikel kategori',
  description LONGTEXT NOT NULL COMMENT 'Deskripsi lengkap kategori',
  heroImage VARCHAR(255) COMMENT 'URL gambar hero',
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Article content untuk setiap kategori produk';

-- STEP 5: Insert kategori default
-- ============================================================
INSERT INTO category_articles (category, title, description) VALUES 
('supporter', 'Supporter Culture', 'Koleksi khusus untuk para supporter yang passionate. Produk dirancang dengan detail yang mencerminkan budaya supporter Indonesia.'),
('casual', 'Casual Daily', 'Koleksi casual untuk penggunaan sehari-hari. Nyaman, stylish, dan cocok untuk berbagai occasion.'),
('outdoor', 'Outdoor Adventure', 'Dirancang untuk petualangan outdoor. Material tahan lama dan desain fungsional untuk aktivitas di alam bebas.'),
('fishing', 'Fishing Lifestyle', 'Koleksi khusus untuk para fishing enthusiast. Practical dan stylish untuk hobby memancing Anda.')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description);

-- STEP 6: Update stok data existing (jika ada data produk sebelumnya)
-- ============================================================
-- Set readyStock = stockQuantity untuk produk existing
UPDATE product SET readyStock = stockQuantity WHERE readyStock = 0;

-- ============================================================
-- VERIFICATION QUERIES (Run untuk verify migration berhasil)
-- ============================================================
-- SELECT * FROM product LIMIT 1; -- cek kolom baru
-- SELECT COUNT(*) FROM po_orders; -- cek tabel po_orders
-- SELECT COUNT(*) FROM inventory_log; -- cek tabel inventory_log
-- SELECT * FROM category_articles; -- cek kategori default

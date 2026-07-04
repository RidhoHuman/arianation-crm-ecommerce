// Script untuk update kategori di database
const mysql = require('mysql2/promise');

async function updateCategories() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'arianation_user',
    password: 'AriaNation@2024',
    database: 'arianation_db',
  });

  console.log('🔄 Updating categories to new lifestyle model...\n');

  try {
    // Truncate old categories (if they exist)
    try {
      await connection.execute('DELETE FROM category_articles');
      console.log('✅ Old categories cleared\n');
    } catch (e) {
      console.log('⚠️ No old data to clear\n');
    }

    // Insert new categories
    const newCategories = [
      {
        category: 'everyday',
        title: 'Everyday Collection',
        description: `Versatile pieces untuk aktivitas sehari-hari. 
Dari berangkat kerja, nonton bola, hang out dengan teman, sampai casual weekend.
Designed untuk comfort dan style yang timeless.
Mix & match sesuai mood dan kegiatan kamu!`,
        heroImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200',
      },
      {
        category: 'work',
        title: 'Work Collection',
        description: `Professional yet cool pieces untuk lingkungan kerja.
Bukan formal yang boring, tapi stylish dan respect.
Bisa untuk meeting, casual friday, atau co-working.
Designed untuk kualitas dan durability di penggunaan rutin.`,
        heroImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200',
      },
      {
        category: 'adventure',
        title: 'Adventure Collection',
        description: `Outdoor-ready pieces yang functional dan stylish.
Dari naik gunung, hiking, padel, sampai aktivitas outdoor lainnya.
Material yang appropriate, design yang practical.
Tapi tetap bisa dipakai casual kalau tidak sedang adventure!`,
        heroImage: 'https://images.unsplash.com/photo-1506368299235-c5271b775560?w=1200',
      },
      {
        category: 'stories',
        title: 'Limited Stories Collection',
        description: `Setiap piece punya cerita authentic di baliknya.
Limited edition yang celebrate Indonesian culture, local artists, regional tribes.
Dari supporter passion, sampai urban scene, dari Malang sampai seluruh Indonesia.
Collectible, meaningful, dan part of movement!`,
        heroImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
      },
    ];

    for (const cat of newCategories) {
      await connection.execute(
        `INSERT INTO category_articles (category, title, description, heroImage) 
         VALUES (?, ?, ?, ?)`,
        [cat.category, cat.title, cat.description, cat.heroImage]
      );
      console.log(`✅ Added category: ${cat.title}`);
    }

    console.log('\n📝 Adding product columns untuk versatility tagging...\n');

    // Add new columns ke product table
    const newColumns = [
      {
        name: 'versatile_uses',
        query: `ALTER TABLE product ADD COLUMN versatile_uses VARCHAR(255) 
                COMMENT 'Comma-separated uses: work,adventure,casual,sports'`,
      },
      {
        name: 'story',
        query: `ALTER TABLE product ADD COLUMN story LONGTEXT 
                COMMENT 'Story di balik produk'`,
      },
      {
        name: 'inspiration',
        query: `ALTER TABLE product ADD COLUMN inspiration VARCHAR(255) 
                COMMENT 'Source of inspiration'`,
      },
      {
        name: 'is_limited',
        query: `ALTER TABLE product ADD COLUMN is_limited BOOLEAN DEFAULT false 
                COMMENT 'Is this limited edition'`,
      },
      {
        name: 'limited_quantity',
        query: `ALTER TABLE product ADD COLUMN limited_quantity INT 
                COMMENT 'Total units for limited edition'`,
      },
      {
        name: 'collaboration_partner',
        query: `ALTER TABLE product ADD COLUMN collaboration_partner VARCHAR(255) 
                COMMENT 'Collaboration partner if any'`,
      },
    ];

    for (const col of newColumns) {
      try {
        await connection.execute(col.query);
        console.log(`✅ Added column: ${col.name}`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️ Column ${col.name} already exists`);
        } else {
          throw err;
        }
      }
    }

    await connection.end();
    console.log('\n🎉 Database update complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateCategories();

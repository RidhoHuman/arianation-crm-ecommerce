const knex = require('./src/config/knex');

async function fixCollation() {
  try {
    console.log('🔄 Memulai perbaikan collation database...');
    
    // Get all tables in the current database
    const [tables] = await knex.raw("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()");
    
    for (const row of tables) {
      const tableName = row.TABLE_NAME || row.table_name;
      console.log(`Menyamakan collation untuk tabel: ${tableName}...`);
      
      // Convert all columns in the table to use utf8mb4_unicode_ci
      // This will fix the 'Illegal mix of collations' error
      await knex.raw(`ALTER TABLE \`${tableName}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    }
    
    console.log('✅ Semua tabel berhasil disamakan (utf8mb4_unicode_ci)');
    
    // Setup FK that failed previously for pointHistory (if needed)
    try {
      await knex.raw(`ALTER TABLE \`pointHistory\` ADD CONSTRAINT \`pointhistory_userid_foreign\` FOREIGN KEY (\`userId\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE;`);
      console.log('✅ pointHistory foreign key constraint berhasil ditambahkan.');
    } catch(e) {
      // Ignore if it already exists
    }
    
  } catch (err) {
    console.error('❌ Terjadi kesalahan:', err.message);
  } finally {
    await knex.destroy();
    process.exit();
  }
}

fixCollation();

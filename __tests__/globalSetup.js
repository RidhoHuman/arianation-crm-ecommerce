const child = require('child_process');
const path = require('path');

module.exports = async () => {
  console.log('\n🚀 Jest Global Setup: Initializing SQLite database schema...');
  const scriptPath = path.resolve(__dirname, '../scripts/create_sqlite_schema.js');
  try {
    child.execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
    console.log('✅ Jest Global Setup: SQLite schema created successfully.\n');
  } catch (err) {
    console.error('❌ Jest Global Setup: Failed to initialize SQLite schema:', err.message);
    process.exit(1);
  }
};

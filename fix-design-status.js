require('dotenv').config();
const knex = require('./src/config/knex');

async function fix() {
  try {
    await knex.raw("ALTER TABLE `designRequest` MODIFY COLUMN status enum('DRAFT','PENDING','SUBMITTED','REVISION_REQUESTED','APPROVED','CANCELLED','REJECTED') NOT NULL DEFAULT 'DRAFT'");
    console.log('Enum updated successfully');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

fix();

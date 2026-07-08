const db = require('./src/config/knex');
async function run() {
  try {
    await db.schema.alterTable('order', table => {
      table.text('deliveryAddress').nullable().alter();
    });
    console.log('Successfully altered deliveryAddress to be nullable');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}
run();

const db = require('./src/config/knex');
async function run() {
  try {
    await db.schema.alterTable('product', table => {
      table.string('unit', 50).defaultTo('pcs').nullable();
    });
    console.log('Successfully added unit column to product table');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}
run();

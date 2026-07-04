const knex = require('./src/config/knex');

async function up() {
  try {
    const hasIsPublic = await knex.schema.hasColumn('voucher', 'isPublic');
    if (!hasIsPublic) {
      console.log('Adding isPublic column to voucher table...');
      await knex.schema.alterTable('voucher', t => {
        t.boolean('isPublic').defaultTo(true);
      });
      console.log('Successfully added isPublic column!');
    } else {
      console.log('Column isPublic already exists.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

up();

const knex = require('./src/config/knex');

async function up() {
  try {
    const hasTargetTier = await knex.schema.hasColumn('voucher', 'targetTier');
    if (!hasTargetTier) {
      console.log('Adding targetTier column to voucher table...');
      await knex.schema.alterTable('voucher', t => {
        t.string('targetTier').defaultTo('ALL');
      });
      console.log('Successfully added targetTier column!');
    } else {
      console.log('Column targetTier already exists.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

up();

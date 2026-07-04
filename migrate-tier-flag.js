const knex = require('./src/config/knex');

async function up() {
  const hasColumn = await knex.schema.hasColumn('customerMetrics', 'isTierManuallySet');
  if (!hasColumn) {
    await knex.schema.table('customerMetrics', table => {
      table.boolean('isTierManuallySet').defaultTo(false).after('currentTier');
    });
    console.log('Successfully added isTierManuallySet to customerMetrics table.');
  } else {
    console.log('isTierManuallySet already exists.');
  }
}

up().catch(console.error).finally(() => knex.destroy());

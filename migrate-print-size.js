require('dotenv').config({ path: ['.env.local', '.env'] });
const knex = require('./src/config/knex');

async function migrate() {
  try {
    const hasTable = await knex.schema.hasTable('designRequest');
    if (hasTable) {
      const columnInfo = await knex('designRequest').columnInfo();
      
      if (!columnInfo.printSize) {
        await knex.schema.alterTable('designRequest', table => {
          table.string('printSize').nullable();
        });
        console.log('Added printSize column to designRequest table');
      } else {
        console.log('printSize column already exists');
      }
      
      console.log('Migration completed successfully');
    } else {
      console.log('Table designRequest does not exist');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();

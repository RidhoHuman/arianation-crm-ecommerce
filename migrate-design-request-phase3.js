require('dotenv').config({ path: ['.env.local', '.env'] });
const knex = require('./src/config/knex');

async function migrate() {
  try {
    const hasTable = await knex.schema.hasTable('designRequest');
    if (hasTable) {
      await knex.schema.alterTable('designRequest', table => {
        // Only add if not exists
      });
      
      const columnInfo = await knex('designRequest').columnInfo();
      
      if (!columnInfo.mockupPreviewUrl) {
        await knex.schema.alterTable('designRequest', table => {
          table.string('mockupPreviewUrl').nullable();
        });
        console.log('Added mockupPreviewUrl column');
      }
      
      if (!columnInfo.canvasMetadata) {
        await knex.schema.alterTable('designRequest', table => {
          table.json('canvasMetadata').nullable();
        });
        console.log('Added canvasMetadata column');
      }
      
      if (!columnInfo.estimatedPrice) {
        await knex.schema.alterTable('designRequest', table => {
          table.decimal('estimatedPrice', 15, 2).nullable();
        });
        console.log('Added estimatedPrice column');
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

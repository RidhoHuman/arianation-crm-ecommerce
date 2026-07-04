const knex = require('./src/config/knex');

async function up() {
  try {
    const hasTable = await knex.schema.hasTable('product_review');
    
    if (!hasTable) {
      console.log('Creating product_review table...');
      await knex.schema.createTable('product_review', table => {
        table.increments('id').primary();
        table.string('productId').notNullable();
        table.string('userId').notNullable();
        table.integer('orderId').notNullable();
        table.integer('rating').notNullable().defaultTo(5);
        table.text('comment').notNullable();
        table.string('imageUrl').nullable();
        table.integer('pointsAwarded').defaultTo(0);
        table.boolean('isVerified').defaultTo(true);
        table.timestamps(true, true); // createdAt, updatedAt
        
        // Foreign keys (Optional depending on how strict you want to be if products get deleted)
        // table.foreign('productId').references('id').inTable('product').onDelete('CASCADE');
        // table.foreign('userId').references('id').inTable('user').onDelete('CASCADE');
      });
      console.log('Successfully created product_review table!');
    } else {
      console.log('Table product_review already exists.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

up();

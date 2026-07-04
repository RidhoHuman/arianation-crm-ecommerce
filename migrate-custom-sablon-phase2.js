const knex = require('./src/config/knex');

async function migrate() {
  try {
    // 1. Portfolio Items Table
    const hasPortfolio = await knex.schema.hasTable('portfolio_items');
    if (!hasPortfolio) {
      console.log('Creating portfolio_items table...');
      await knex.schema.createTable('portfolio_items', (table) => {
        table.increments('id').primary();
        table.string('title').notNullable();
        table.string('category').notNullable();
        table.string('image').notNullable();
        table.boolean('isActive').defaultTo(true);
        table.timestamp('createdAt').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').defaultTo(knex.fn.now());
      });
      console.log('Created portfolio_items table.');
    } else {
      console.log('portfolio_items table already exists.');
    }

    // 2. FAQ Items Table
    const hasFaq = await knex.schema.hasTable('faq_items');
    if (!hasFaq) {
      console.log('Creating faq_items table...');
      await knex.schema.createTable('faq_items', (table) => {
        table.increments('id').primary();
        table.text('question').notNullable();
        table.text('answer').notNullable();
        table.integer('orderIndex').defaultTo(0);
        table.boolean('isActive').defaultTo(true);
        table.timestamp('createdAt').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').defaultTo(knex.fn.now());
      });
      console.log('Created faq_items table.');
    } else {
      console.log('faq_items table already exists.');
    }

    // 3. Print Techniques Table
    const hasPrintTech = await knex.schema.hasTable('print_techniques');
    if (!hasPrintTech) {
      console.log('Creating print_techniques table...');
      await knex.schema.createTable('print_techniques', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.text('characteristics');
        table.text('cons');
        table.decimal('basePrice', 10, 2).defaultTo(0);
        table.decimal('pricePerColor', 10, 2).defaultTo(0);
        table.integer('minOrder').defaultTo(1);
        table.boolean('isManual').defaultTo(false);
        table.boolean('isActive').defaultTo(true);
        table.timestamp('createdAt').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').defaultTo(knex.fn.now());
      });
      console.log('Created print_techniques table.');
    } else {
      console.log('print_techniques table already exists.');
    }

    console.log('Phase 2 Migration Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

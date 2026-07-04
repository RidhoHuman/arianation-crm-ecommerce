require('dotenv').config();
const knex = require('./src/config/knex');

async function updateSchema() {
  try {
    const hasTags = await knex.schema.hasColumn('product', 'tags');
    if (!hasTags) {
      await knex.schema.alterTable('product', t => {
        t.string('tags').nullable();
        t.boolean('isSale').defaultTo(false);
        t.text('imageUrls').nullable();
      });
      console.log('✅ Added tags, isSale, imageUrls to product table');
    } else {
      console.log('Columns already exist.');
    }
    
    // Also create productVariant table if missing
    const hasProductVariant = await knex.schema.hasTable('productVariant');
    if (!hasProductVariant) {
        await knex.schema.createTable('productVariant', (t) => {
            t.string('id').primary();
            t.string('productId');
            t.string('variantName');
            t.string('sku').nullable();
            t.decimal('additionalPrice', 10, 2).defaultTo(0);
            t.integer('stockQuantity').defaultTo(0);
            t.timestamp('createdAt').defaultTo(knex.fn.now());
            t.timestamp('updatedAt').defaultTo(knex.fn.now());
        });
        console.log('✅ Created productVariant table');
    }

    // Also create product_color_variant table if missing
    const hasColorVariant = await knex.schema.hasTable('product_color_variant');
    if (!hasColorVariant) {
        await knex.schema.createTable('product_color_variant', (t) => {
            t.string('id').primary();
            t.string('productId');
            t.string('colorName');
            t.string('hexCode').nullable();
            t.string('imageUrl').nullable();
            t.string('imageUrlBack').nullable();
            t.string('imageUrlLeft').nullable();
            t.string('imageUrlRight').nullable();
            t.integer('stockQuantity').defaultTo(0);
            t.timestamp('createdAt').defaultTo(knex.fn.now());
            t.timestamp('updatedAt').defaultTo(knex.fn.now());
        });
        console.log('✅ Created product_color_variant table');
    }

    // Also create product_collection table if missing
    const hasProductCollection = await knex.schema.hasTable('product_collection');
    if (!hasProductCollection) {
        await knex.schema.createTable('product_collection', (t) => {
            t.string('productId');
            t.string('collectionId');
            t.primary(['productId', 'collectionId']);
        });
        console.log('✅ Created product_collection table');
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    await knex.destroy();
  }
}

updateSchema();

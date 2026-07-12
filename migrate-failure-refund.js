require('dotenv').config();
const knex = require('./src/config/knex');

async function run() {
  try {
    console.log('Running migration to update ENUM statuses...');
    
    // Update order.status ENUM
    await knex.raw(`
      ALTER TABLE \`order\` 
      MODIFY COLUMN status ENUM(
        'PENDING', 
        'CONFIRMED', 
        'PROCESSING', 
        'READY_FOR_DELIVERY', 
        'SHIPPED', 
        'DELIVERED', 
        'CANCELLED', 
        'FAILED', 
        'ABANDONED', 
        'ON_HOLD', 
        'REFUND_REQUESTED', 
        'REFUNDED', 
        'RETURNED'
      ) NOT NULL DEFAULT 'PENDING'
    `);
    console.log('Successfully updated order status ENUM.');

    // Update designRequest.status ENUM
    await knex.raw(`
      ALTER TABLE \`designRequest\` 
      MODIFY COLUMN status ENUM(
        'DRAFT', 
        'PENDING', 
        'REVISION_REQUESTED', 
        'APPROVED', 
        'CANCELLED', 
        'REJECTED'
      ) NOT NULL DEFAULT 'DRAFT'
    `);
    console.log('Successfully updated designRequest status ENUM.');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run();

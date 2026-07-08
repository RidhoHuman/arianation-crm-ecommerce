const knex = require('./src/config/knex');

async function migratePaymentSchema() {
  try {
    console.log('Starting payment schema migration...');

    // 1. Drop UNIQUE constraint from Payment.orderId
    // In MySQL, a unique constraint is an index. The index name is usually the same as the constraint.
    const hasIndex = await knex.raw(`
      SELECT COUNT(1) AS count 
      FROM information_schema.statistics 
      WHERE table_schema = 'arianation_db' 
        AND table_name = 'payment' 
        AND index_name = 'Payment_orderId_key'
    `);
    
    if (hasIndex[0][0].count > 0) {
      console.log('Dropping UNIQUE index Payment_orderId_key from payment table...');
      await knex.raw(`ALTER TABLE payment DROP INDEX Payment_orderId_key`);
      console.log('Successfully dropped UNIQUE index.');
    } else {
      console.log('UNIQUE index Payment_orderId_key not found. Skipping.');
    }

    // 2. Add paymentType column to Payment
    const hasColumn = await knex.raw(`
      SELECT COUNT(1) AS count
      FROM information_schema.columns
      WHERE table_schema = 'arianation_db'
        AND table_name = 'payment'
        AND column_name = 'paymentType'
    `);

    if (hasColumn[0][0].count === 0) {
      console.log('Adding paymentType column to payment table...');
      await knex.raw(`ALTER TABLE payment ADD COLUMN paymentType ENUM('FULL', 'DP', 'PELUNASAN') NOT NULL DEFAULT 'FULL'`);
      console.log('Successfully added paymentType column.');
    } else {
      console.log('Column paymentType already exists. Skipping.');
    }

    // 3. Update Order status ENUM
    console.log('Updating order status ENUM...');
    await knex.raw(`
      ALTER TABLE \`order\` 
      MODIFY COLUMN \`status\` ENUM(
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'READY_FOR_DELIVERY',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'FAILED',
        'PAID_WAITING_APPROVAL',
        'WAITING_FINAL_PAYMENT',
        'READY_TO_SHIP',
        'IN_PRODUCTION',
        'ABANDONED'
      ) NOT NULL DEFAULT 'PENDING'
    `);
    console.log('Successfully updated order status ENUM.');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migratePaymentSchema();

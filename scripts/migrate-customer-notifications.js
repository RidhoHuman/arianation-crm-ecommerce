const knex = require('../src/config/knex');

async function migrate() {
  console.log('Starting migration for customerNotification (Polymorphic)...');
  
  try {
    const hasTable = await knex.schema.hasTable('customerNotification');
    if (!hasTable) {
      console.log('Creating customerNotification table...');
      await knex.schema.createTable('customerNotification', (table) => {
        table.string('id').primary();
        table.string('userId').nullable();
        table.string('recipientEmail').nullable();
        table.string('referenceId').nullable(); // Can be orderId, designRequestId, etc.
        table.string('referenceType').nullable(); // 'ORDER', 'DESIGN_REQUEST', 'SYSTEM'
        table.string('type').notNullable(); // Notification type, e.g. 'DESIGN_REQUEST_SUBMITTED'
        table.string('title').notNullable();
        table.text('message').notNullable();
        table.boolean('emailSent').defaultTo(false).notNullable();
        table.datetime('sentAt').nullable();
        table.datetime('createdAt', { precision: 3 }).defaultTo(knex.raw('CURRENT_TIMESTAMP(3)')).notNullable();
        table.boolean('isRead').defaultTo(false);
        
        table.index('userId');
        table.index(['referenceId', 'referenceType']);
        table.index('type');
      });
      console.log('Table customerNotification created successfully.');
    } else {
      console.log('Table customerNotification already exists.');
    }

    // Optional: Migrate existing data from orderNotification
    const hasOrderNotif = await knex.schema.hasTable('orderNotification');
    if (hasOrderNotif) {
      console.log('Migrating existing order notifications...');
      const orderNotifs = await knex('orderNotification').select('*');
      
      for (const notif of orderNotifs) {
        const existing = await knex('customerNotification').where('id', notif.id).first();
        if (!existing) {
          await knex('customerNotification').insert({
            id: notif.id,
            userId: notif.userId,
            recipientEmail: notif.recipientEmail,
            referenceId: notif.orderId,
            referenceType: 'ORDER',
            type: notif.type,
            title: notif.title,
            message: notif.message,
            emailSent: notif.emailSent,
            sentAt: notif.sentAt,
            createdAt: notif.createdAt,
            isRead: notif.isRead,
          });
        }
      }
      console.log(`Migrated ${orderNotifs.length} records from orderNotification.`);
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();

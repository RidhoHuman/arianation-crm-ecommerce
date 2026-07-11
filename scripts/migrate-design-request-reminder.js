require('dotenv').config();
const knex = require('../src/config/knex');

async function migrate() {
  try {
    console.log('Migrating designRequest table for reminders...');
    
    // 1. Update ENUM to include CANCELLED
    await knex.raw(`
      ALTER TABLE \`designRequest\` 
      MODIFY COLUMN \`status\` ENUM(
        'DRAFT',
        'SUBMITTED',
        'UNDER_REVIEW',
        'REVISION_REQUESTED',
        'APPROVED',
        'REJECTED',
        'IN_PRODUCTION',
        'COMPLETED',
        'CANCELLED'
      ) NOT NULL DEFAULT 'DRAFT'
    `);
    console.log('✅ Added CANCELLED to status ENUM');

    // 2. Add reminderCount and lastRemindedAt columns
    const hasReminderCount = await knex.schema.hasColumn('designRequest', 'reminderCount');
    if (!hasReminderCount) {
      await knex.schema.alterTable('designRequest', table => {
        table.integer('reminderCount').notNullable().defaultTo(0);
        table.datetime('lastRemindedAt').nullable();
      });
      console.log('✅ Added reminderCount and lastRemindedAt columns');
    } else {
      console.log('⚠️ reminderCount column already exists');
    }

    console.log('🎉 Migration successful!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();

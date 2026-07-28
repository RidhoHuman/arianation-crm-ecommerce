const knex = require('./src/config/knex');

async function migrate() {
  try {
    const hasToken = await knex.schema.hasColumn('user', 'resetPasswordToken');
    if (!hasToken) {
      await knex.schema.alterTable('user', table => {
        table.string('resetPasswordToken').nullable();
        table.datetime('resetPasswordExpires').nullable();
      });
      console.log('Successfully added resetPasswordToken and resetPasswordExpires columns to user table.');
    } else {
      console.log('Columns already exist.');
    }
  } catch (error) {
    console.error('Error adding columns:', error);
  } finally {
    process.exit();
  }
}

migrate();

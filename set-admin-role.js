// Set admin user role
const knex = require('./src/config/knex');

async function setAdminRole() {
  try {
    const updatedRows = await knex('user')
      .where({ email: 'owner@arianation.com' })
      .update({ role: 'OWNER' });
      
    if (updatedRows > 0) {
      console.log('✅ User promoted to OWNER role: owner@arianation.com');
    } else {
      console.log('⚠️ User not found or already owner');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setAdminRole();

const knex = require('../src/config/knex');
const bcrypt = require('bcryptjs');

async function fixAdmin() {
  try {
    const adminEmail = 'admin@arianation.com';
    const password = 'admin123';
    
    // Check if admin exists
    const admin = await knex('user').where('email', adminEmail).first();
    
    if (admin) {
      console.log('Admin user found. Resetting password to admin123...');
      const hashedPassword = await bcrypt.hash(password, 10);
      await knex('user').where('email', adminEmail).update({
        password: hashedPassword,
        isActive: true,
        role: 'ADMIN'
      });
      console.log('Password successfully reset to: admin123');
    } else {
      console.log('Admin user not found. Creating admin user...');
      const hashedPassword = await bcrypt.hash(password, 10);
      const cuid = require('cuid')();
      await knex('user').insert({
        id: cuid,
        email: adminEmail,
        password: hashedPassword,
        fullName: 'Admin Staff',
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Admin user successfully created with password: admin123');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await knex.destroy();
  }
}

fixAdmin();

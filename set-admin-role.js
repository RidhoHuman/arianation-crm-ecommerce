// Set admin user role
const prisma = require('./src/config/database');

async function setAdminRole() {
  try {
    const user = await prisma.user.update({
      where: { email: 'owner@arianation.com' },
      data: { role: 'OWNER' },
    });
    console.log('✅ User promoted to OWNER role:', user.email);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setAdminRole();

const knex = require('./src/config/knex');
async function fix() {
  await knex.raw("UPDATE customerMetrics m JOIN user u ON u.id = m.userId SET m.isTierManuallySet = 0 WHERE u.email = 'ridhohuman11@gmail.com'");
  console.log('Fixed');
  process.exit();
}
fix();

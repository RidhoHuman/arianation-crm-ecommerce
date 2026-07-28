const knex = require('./src/config/knex');
async function check() {
  const result = await knex.raw("SELECT m.isTierManuallySet, m.currentTier, m.totalSpent FROM customerMetrics m JOIN user u ON u.id = m.userId WHERE u.email = 'ridhohuman11@gmail.com'");
  console.log(result[0]);
  process.exit();
}
check();

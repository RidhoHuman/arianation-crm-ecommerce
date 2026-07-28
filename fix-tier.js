const knex = require('./src/config/knex');
async function fixTier() {
  await knex.raw("UPDATE customerMetrics m JOIN user u ON u.id = m.userId SET m.currentTier = 'PLATINUM' WHERE u.email = 'ridhohuman11@gmail.com'");
  console.log('Tier updated to Platinum');
  process.exit();
}
fixTier();

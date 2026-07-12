const knex = require('./src/config/knex');
knex.raw("SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_NAME = 'order' AND COLUMN_NAME = 'status' AND TABLE_SCHEMA = 'arianation_db'")
  .then(res => { console.log(res[0]); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });

const knex = require('./src/config/knex');
knex.raw("SHOW COLUMNS FROM `order` WHERE Field = 'status'").then(res => {
  console.log(res[0]);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});

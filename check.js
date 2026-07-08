const knex = require('./src/config/knex');
knex.raw('SHOW COLUMNS FROM payment LIKE "method"').then(r => console.log(r[0][0].Type)).finally(() => knex.destroy());

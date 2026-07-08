const knex = require('./src/config/knex');
knex.raw('SHOW TABLES').then(res => console.log(res[0])).catch(e => console.error(e)).finally(() => knex.destroy());

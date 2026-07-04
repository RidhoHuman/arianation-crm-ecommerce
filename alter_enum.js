const knex = require('./src/config/knex');
knex.raw("ALTER TABLE product MODIFY COLUMN productType ENUM('PHYSICAL','DIGITAL','CUSTOM','KAOS','ATRIBUT','SABLON_TEMPLATE') NOT NULL")
  .then(() => console.log('Schema updated'))
  .catch(console.error)
  .finally(() => process.exit(0));

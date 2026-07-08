const knex = require('./src/config/knex');
knex.raw("ALTER TABLE payment MODIFY COLUMN method enum('QRIS','BANK_TRANSFER','COD','MIDTRANS','XENDIT') NOT NULL")
  .then(() => console.log('ALTERED'))
  .catch(e => console.error(e))
  .finally(() => knex.destroy());

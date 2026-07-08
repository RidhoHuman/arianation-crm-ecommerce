const knex = require('./src/config/knex');
knex.raw("ALTER TABLE `order` MODIFY COLUMN paymentMethod enum('QRIS','BANK_TRANSFER','COD','MIDTRANS','XENDIT') NOT NULL")
  .then(() => console.log('ALTERED ORDER TABLE'))
  .catch(e => console.error(e))
  .finally(() => knex.destroy());

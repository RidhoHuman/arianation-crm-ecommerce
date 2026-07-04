const knex = require('./src/config/knex');

async function check() {
  const [cols] = await knex.raw(`
    SELECT COLUMN_NAME, COLUMN_TYPE, CHARACTER_SET_NAME, COLLATION_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME='product' AND COLUMN_NAME='id'
  `);
  console.log("Product ID type:", cols);
  process.exit(0);
}
check();

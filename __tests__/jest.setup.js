const db = require('../src/config/knex');

afterAll(async () => {
  if (db && typeof db.destroy === 'function') {
    await db.destroy();
  }
});

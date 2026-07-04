const db = require('./src/config/knex');

async function check() {
  try {
    const categories = await db('productcategory').select('*');
    console.log(categories);
  } catch (error) {
    console.error("Error querying db:", error);
  } finally {
    await db.destroy();
  }
}

check();

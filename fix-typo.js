const db = require('./src/config/knex');

async function fixTypo() {
  try {
    const updated = await db('product')
      .where('productName', 'Jersey Frist Edition Arianation')
      .update({ productName: 'Jersey First Edition Arianation' });
    console.log('Rows updated:', updated);
  } catch (error) {
    console.error("Error updating db:", error);
  } finally {
    await db.destroy();
  }
}

fixTypo();

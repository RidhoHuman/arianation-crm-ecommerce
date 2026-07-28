const knex = require('./src/config/knex');

async function updateTechniques() {
  try {
    const allowed = JSON.stringify(["cat-pakaian", "cat-tas"]);
    
    await knex('print_techniques')
      .whereIn('name', ['Plastisol (Sablon Manual)', 'Rubber (Sablon Manual)', 'Bordir Komputer'])
      .update({
        allowedCategories: allowed
      });
      
    console.log('Update success');
  } catch (error) {
    console.error('Update failed:', error);
  } finally {
    process.exit(0);
  }
}

updateTechniques();

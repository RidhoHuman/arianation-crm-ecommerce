const knex = require('./src/config/knex');

async function fixUrls() {
  try {
    const products = await knex('product').select('id', 'imageUrl', 'imageUrls');
    let updatedCount = 0;
    for (const p of products) {
      let needsUpdate = false;
      let newUrl = p.imageUrl;
      if (newUrl && newUrl.includes('http://localhost:3001')) {
        newUrl = newUrl.replace('http://localhost:3001', '');
        needsUpdate = true;
      }
      
      let newUrls = p.imageUrls;
      // imageUrls is stored as JSON array string or JSON depending on Knex mapping
      if (newUrls) {
         if (typeof newUrls === 'string') {
            if (newUrls.includes('http://localhost:3001')) {
               newUrls = newUrls.replace(/http:\/\/localhost:3001/g, '');
               needsUpdate = true;
            }
         } else if (Array.isArray(newUrls)) {
            let changed = false;
            const updatedArray = newUrls.map(url => {
               if (typeof url === 'string' && url.includes('http://localhost:3001')) {
                  changed = true;
                  return url.replace('http://localhost:3001', '');
               }
               return url;
            });
            if (changed) {
               newUrls = JSON.stringify(updatedArray);
               needsUpdate = true;
            }
         }
      }

      if (needsUpdate) {
        await knex('product').where('id', p.id).update({ imageUrl: newUrl });
        updatedCount++;
      }
    }
    
    // Fix variants
    const variants = await knex('productVariant').select('id', 'imageUrl');
    let variantsUpdated = 0;
    for (const v of variants) {
        let newUrl = v.imageUrl;
        if (newUrl && newUrl.includes('http://localhost:3001')) {
            newUrl = newUrl.replace('http://localhost:3001', '');
            await knex('productVariant').where('id', v.id).update({ imageUrl: newUrl });
            variantsUpdated++;
        }
    }
    
    console.log(`Fixed ${updatedCount} products, ${variantsUpdated} variants`);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

fixUrls();

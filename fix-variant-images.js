const knex = require('./src/config/knex');

async function fixVariantImages() {
  try {
    const variants = await knex('productVariant').select('*');
    let updatedCount = 0;

    for (let v of variants) {
      if (!v.imageUrl && v.variantName && v.variantName.includes('-')) {
        const colorPrefix = v.variantName.split('-')[0].trim();
        
        // Find a sibling variant with the same product ID and same color prefix that HAS an imageUrl
        const sibling = variants.find(s => 
          s.productId === v.productId && 
          s.variantName && 
          s.variantName.split('-')[0].trim() === colorPrefix &&
          s.imageUrl
        );

        if (sibling) {
          await knex('productVariant')
            .where('id', v.id)
            .update({ imageUrl: sibling.imageUrl });
          updatedCount++;
          console.log(`Updated variant ${v.variantName} with image from ${sibling.variantName}`);
        }
      }
    }
    console.log(`Successfully fixed ${updatedCount} variant images!`);
  } catch (err) {
    console.error(err);
  } finally {
    await knex.destroy();
  }
}

fixVariantImages();

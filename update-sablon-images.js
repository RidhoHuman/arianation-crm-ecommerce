const knex = require('./src/config/knex');

const PRODUCT_CATALOG = [
  // Pakaian
  { id: 'Cotton Combed 30s', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop' },
  { id: 'Cotton Combed 30s (Panjang)', image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=800&auto=format&fit=crop' },
  { id: 'Cotton Combed 24s', image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=800&auto=format&fit=crop' },
  { id: 'Cotton Combed 24s (Panjang)', image: 'https://images.unsplash.com/photo-1618354691438-25bc04584c23?q=80&w=800&auto=format&fit=crop' },
  { id: 'Cotton Bamboo', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=800&auto=format&fit=crop' },
  { id: 'Fleece (Hoodie)', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop' },
  { id: 'Lacoste (Polo)', image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?q=80&w=800&auto=format&fit=crop' },
  { id: 'Bawa Kaos Sendiri', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop' },
  // Tas & Merchandise
  { id: 'Tote Bag (Kanvas)', image: 'https://images.unsplash.com/photo-1597484661643-2f5fef640df1?q=80&w=800&auto=format&fit=crop' },
  { id: 'Tote Bag (Blacu)', image: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?q=80&w=800&auto=format&fit=crop' },
  { id: 'Drawstring Bag', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop' },
  { id: 'Apron (Celemek)', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800&auto=format&fit=crop' },
  { id: 'Goodie Bag (Spunbond)', image: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?q=80&w=800&auto=format&fit=crop' },
  // Packaging
  { id: 'Polymailer Sablon', image: 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?q=80&w=800&auto=format&fit=crop' },
  { id: 'Paper Bag', image: 'https://images.unsplash.com/photo-1587522501438-e6d8a436940a?q=80&w=800&auto=format&fit=crop' },
  { id: 'Corrugated Box', image: 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?q=80&w=800&auto=format&fit=crop' }
];

async function run() {
  try {
    for (const prod of PRODUCT_CATALOG) {
      // Only update if it's the default image, empty, or placehold.co
      const existing = await knex('product').where({ id: prod.id }).first();
      if (existing && (!existing.imageUrl || existing.imageUrl.includes('default.png') || existing.imageUrl.includes('placehold.co'))) {
        await knex('product').where({ id: prod.id }).update({ imageUrl: prod.image });
        console.log(`Updated ${prod.id} with high-res Unsplash image`);
      }
    }
    console.log('Update finished.');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
run();

const knex = require('./src/config/knex');

const CATEGORIES = [
  { id: 'cat-pakaian', name: 'Pakaian', type: 'SABLON_SERVICE' },
  { id: 'cat-tas', name: 'Tas & Merchandise', type: 'SABLON_SERVICE' },
  { id: 'cat-packaging', name: 'Packaging', type: 'SABLON_SERVICE' }
];

const PRODUCTS = [
  // Pakaian
  { id: 'Cotton Combed 30s', categoryId: 'cat-pakaian', name: 'Cotton Combed 30s', price: 45000, desc: 'Ringan & Adem', image: '/uploads/products/default.png' },
  { id: 'Cotton Combed 30s (Panjang)', categoryId: 'cat-pakaian', name: 'Cotton Combed 30s (Panjang)', price: 55000, desc: 'Ringan & Adem (Lengan Panjang)', image: '/uploads/products/default.png' },
  { id: 'Cotton Combed 24s', categoryId: 'cat-pakaian', name: 'Cotton Combed 24s', price: 50000, desc: 'Tebal & Elegan', image: '/uploads/products/default.png' },
  { id: 'Cotton Combed 24s (Panjang)', categoryId: 'cat-pakaian', name: 'Cotton Combed 24s (Panjang)', price: 60000, desc: 'Tebal & Elegan (Lengan Panjang)', image: '/uploads/products/default.png' },
  { id: 'Cotton Bamboo', categoryId: 'cat-pakaian', name: 'Cotton Bamboo', price: 60000, desc: 'Anti-bakteri', image: '/uploads/products/default.png' },
  { id: 'Fleece (Hoodie)', categoryId: 'cat-pakaian', name: 'Fleece (Hoodie)', price: 120000, desc: 'Fleece Lembut', image: '/uploads/products/default.png' },
  { id: 'Lacoste (Polo)', categoryId: 'cat-pakaian', name: 'Lacoste (Polo)', price: 75000, desc: 'Formal & Rapi', image: '/uploads/products/default.png' },
  { id: 'Bawa Kaos Sendiri', categoryId: 'cat-pakaian', name: 'Bawa Sendiri', price: 0, desc: 'Hanya Jasa Sablon', image: '/uploads/products/default.png' },
  
  // Tas & Merchandise
  { id: 'Tote Bag (Kanvas)', categoryId: 'cat-tas', name: 'Tote Bag Kanvas', price: 35000, desc: 'Tebal & Premium', image: '/uploads/products/default.png' },
  { id: 'Tote Bag (Blacu)', categoryId: 'cat-tas', name: 'Tote Bag Blacu', price: 15000, desc: 'Ringan & Murah', image: '/uploads/products/default.png' },
  { id: 'Drawstring Bag', categoryId: 'cat-tas', name: 'Tas Serut', price: 25000, desc: 'Tas Serut Gym', image: '/uploads/products/default.png' },
  { id: 'Apron (Celemek)', categoryId: 'cat-tas', name: 'Apron / Celemek', price: 55000, desc: 'Kanvas Drill', image: '/uploads/products/default.png' },
  { id: 'Goodie Bag (Spunbond)', categoryId: 'cat-tas', name: 'Tas Spunbond', price: 5000, desc: 'Goodie Bag Murah', image: '/uploads/products/default.png' },
  
  // Packaging
  { id: 'Polymailer Sablon', categoryId: 'cat-packaging', name: 'Plastik Polymailer', price: 2000, desc: 'Tebal & Glossy', image: '/uploads/products/default.png' },
  { id: 'Paper Bag', categoryId: 'cat-packaging', name: 'Paper Bag Kraft', price: 3500, desc: 'Kertas Coklat', image: '/uploads/products/default.png' },
  { id: 'Corrugated Box', categoryId: 'cat-packaging', name: 'Box Sepatu/Hampers', price: 8000, desc: 'Kardus Tebal', image: '/uploads/products/default.png' }
];

async function seed() {
  try {
    console.log('🔄 Memasukkan data Kategori & Produk Custom Sablon ke Database...');

    // 1. Insert Categories
    for (const cat of CATEGORIES) {
      const existingCat = await knex('productCategory').where({ categoryName: cat.name }).first();
      let actualCatId = cat.id;

      if (!existingCat) {
        await knex('productCategory').insert({
          id: cat.id,
          categoryName: cat.name,
          businessType: cat.type,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✅ Kategori dibuat: ${cat.name}`);
      } else {
        actualCatId = existingCat.id; // use existing ID if name matched
        console.log(`ℹ️ Kategori sudah ada: ${cat.name}`);
      }

      // 2. Insert Products for this category
      const catProducts = PRODUCTS.filter(p => p.categoryId === cat.id);
      for (const prod of catProducts) {
        // Use ID check
        const existingProd = await knex('product').where({ id: prod.id }).first();
        if (!existingProd) {
          await knex('product').insert({
            id: prod.id,
            categoryId: actualCatId,
            productName: prod.name,
            price: prod.price,
            stockQuantity: 999,
            productType: 'SABLON_TEMPLATE', // Important: This marks it as Custom Sablon
            businessType: 'SABLON_SERVICE',
            imageUrl: prod.image,
            description: prod.desc,
            isActive: true,
            isSale: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log(`  + Produk ditambahkan: ${prod.name}`);
        } else {
          console.log(`  - Produk sudah ada (di-skip): ${prod.name}`);
        }
      }
    }

    console.log('\n🎉 Selesai! Semua data produk awal sudah masuk ke database. Silakan refresh halaman.');
  } catch (err) {
    console.error('❌ Gagal memasukkan data:', err);
  } finally {
    await knex.destroy();
  }
}

seed();

const knex = require('./src/config/knex');

const CATEGORIES = [
  { id: 'everyday', name: 'Everyday Collection', type: 'FASHION_RETAIL', isActive: true },
  { id: 'work', name: 'Work Collection', type: 'FASHION_RETAIL', isActive: true },
  { id: 'adventure', name: 'Adventure Collection', type: 'FASHION_RETAIL', isActive: true },
  { id: 'stories', name: 'Stories Collection', type: 'FASHION_RETAIL', isActive: true }
];

const COLLECTIONS = [
  { id: 'featured', name: 'Featured', slug: 'featured', isActive: true },
  { id: 'new-arrivals', name: 'New Arrivals', slug: 'new-arrivals', isActive: true },
  { id: 'best-seller', name: 'Best Seller', slug: 'best-seller', isActive: true }
];

const PRODUCT_TYPES = [
  { id: 'type-tshirt', name: 'T-Shirts', slug: 't-shirts', isActive: true },
  { id: 'type-hoodie', name: 'Hoodies', slug: 'hoodies', isActive: true },
  { id: 'type-pants', name: 'Pants', slug: 'pants', isActive: true },
  { id: 'type-acc', name: 'Accessories', slug: 'accessories', isActive: true }
];

const PRODUCTS = [
  // EVERYDAY
  { id: 'prod-ev-1', categoryId: 'everyday', typeId: 'type-tshirt', name: 'Arianation Basic Tee - Black', price: 149000, desc: 'Kaos harian premium yang nyaman.', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80', type: 'KAOS', isSale: false },
  { id: 'prod-ev-2', categoryId: 'everyday', typeId: 'type-tshirt', name: 'Arianation Basic Tee - White', price: 149000, desc: 'Kaos harian premium yang nyaman.', image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&q=80', type: 'KAOS', isSale: false },
  
  // WORK
  { id: 'prod-wk-1', categoryId: 'work', typeId: 'type-tshirt', name: 'Polo Shirt Professional', price: 249000, desc: 'Polo shirt elegan untuk ke kantor.', image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&q=80', type: 'KAOS', isSale: false },
  { id: 'prod-wk-2', categoryId: 'work', typeId: 'type-pants', name: 'Chino Pants Slim Fit', price: 299000, desc: 'Celana chino untuk tampil profesional namun santai.', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80', type: 'ATRIBUT', isSale: false },
  
  // ADVENTURE
  { id: 'prod-adv-1', categoryId: 'adventure', typeId: 'type-hoodie', name: 'Arianation Outdoor Hoodie', price: 349000, desc: 'Hoodie tahan angin untuk petualangan.', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80', type: 'KAOS', isSale: true },
  { id: 'prod-adv-2', categoryId: 'adventure', typeId: 'type-acc', name: 'Adventure Cap', price: 99000, desc: 'Topi tangguh untuk cuaca panas.', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80', type: 'ATRIBUT', isSale: false },
  
  // STORIES
  { id: 'prod-st-1', categoryId: 'stories', typeId: 'type-tshirt', name: 'Malang Heritage Tee', price: 199000, desc: 'Kaos dengan desain warisan budaya Malang.', image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80', type: 'KAOS', isSale: false },
  { id: 'prod-st-2', categoryId: 'stories', typeId: 'type-hoodie', name: 'Supporter Culture Zip Hoodie', price: 399000, desc: 'Hoodie dengan semangat supporter culture.', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80', type: 'KAOS', isSale: false }
];

async function seed() {
  try {
    console.log('🔄 Membersihkan data test (MP884DGH) beserta relasinya...');
    const testProducts = await knex('product').where('productName', 'like', '%mp884dgh%').select('id');
    const testProductIds = testProducts.map(p => p.id);
    
    if (testProductIds.length > 0) {
      await knex('orderitem').whereIn('productId', testProductIds).del().catch(()=>null);
      await knex('cartitem').whereIn('productId', testProductIds).del().catch(()=>null);
      await knex('wishlist').whereIn('productId', testProductIds).del().catch(()=>null);
      await knex('productReview').whereIn('productId', testProductIds).del().catch(()=>null);
    }

    await knex('product').where('productName', 'like', '%mp884dgh%').del();
    await knex('productCategory').where('categoryName', 'like', '%mp884dgh%').del();
    console.log('✅ Data test berhasil dihapus.');

    console.log('\n🔄 Memasukkan data Kategori Retail...');
    const catIdMap = {};
    for (const cat of CATEGORIES) {
      const existing = await knex('productCategory').where({ categoryName: cat.name }).first();
      if (!existing) {
        await knex('productCategory').insert({
          id: cat.id,
          categoryName: cat.name,
          businessType: cat.type,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        catIdMap[cat.id] = cat.id;
      } else {
        catIdMap[cat.id] = existing.id;
      }
    }

    console.log('\n🔄 Memasukkan data Collection...');
    const colIdMap = {};
    for (const col of COLLECTIONS) {
      const existing = await knex('collection').where({ slug: col.slug }).first();
      if (!existing) {
        await knex('collection').insert({
          id: col.id,
          name: col.name,
          slug: col.slug,
          isActive: col.isActive,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        colIdMap[col.id] = col.id;
      } else {
        colIdMap[col.id] = existing.id;
      }
    }
    
    console.log('\n🔄 Memasukkan data Product Type...');
    const typeIdMap = {};
    for (const typ of PRODUCT_TYPES) {
      const existing = await knex('product_type_master').where({ slug: typ.slug }).first();
      if (!existing) {
        await knex('product_type_master').insert({
          id: typ.id,
          typeName: typ.name,
          slug: typ.slug,
          isActive: typ.isActive,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        typeIdMap[typ.id] = typ.id;
      } else {
        typeIdMap[typ.id] = existing.id;
      }
    }

    console.log('\n🔄 Memasukkan data Produk Retail...');
    for (const prod of PRODUCTS) {
      const existing = await knex('product').where({ productName: prod.name }).first();
      let actualProdId = prod.id;
      if (!existing) {
        await knex('product').insert({
          id: prod.id,
          categoryId: catIdMap[prod.categoryId],
          productName: prod.name,
          price: prod.price,
          stockQuantity: 15,
          productType: prod.type,
          businessType: 'FASHION_RETAIL',
          imageUrl: prod.image,
          description: prod.desc,
          isActive: true,
          isSale: prod.isSale,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`  + Produk ditambahkan: ${prod.name}`);
      } else {
        actualProdId = existing.id;
      }
      
      // Masukkan ke product_collection 'featured', 'new-arrivals', 'best-seller' secara acak
      const collectionIds = ['featured'];
      if (prod.id.includes('st') || prod.id.includes('adv-2') || prod.id.includes('ev-2')) collectionIds.push('new-arrivals');
      if (prod.id.includes('wk') || prod.id.includes('adv-1') || prod.id.includes('ev-1')) collectionIds.push('best-seller');
      
      for (const colId of collectionIds) {
        const existingCol = await knex('product_collection')
          .where({ productId: actualProdId, collectionId: colIdMap[colId] }).first();
        if (!existingCol) {
          await knex('product_collection').insert({
            productId: actualProdId,
            collectionId: colIdMap[colId]
          });
        }
      }
    }

    console.log('\n🎉 Selesai! Semua data telah diperbarui. Silakan refresh website.');
  } catch (err) {
    console.error('❌ Gagal menjalankan script:', err);
  } finally {
    await knex.destroy();
  }
}

seed();

/**
 * fix-sablon-categories.js
 * ========================
 * ONE-TIME Migration Script
 * 
 * Masalah: 16 produk sablon menggunakan categoryId fiktif (cat-pakaian, cat-tas, cat-packaging)
 * yang TIDAK ADA di tabel productCategory. Ini menyebabkan "Data Hantu" / Orphan Data.
 * 
 * Solusi:
 *  1. Buat 3 kategori SABLON_SERVICE yang sah di productCategory
 *  2. Update semua produk sablon agar mengarah ke categoryId yang valid
 *  3. Set trackStock = false untuk semua "Bawa Sendiri"
 *  4. Set harga = 0 untuk semua "Bawa Sendiri"
 */

const db = require('./src/config/knex');
const cuid = require('cuid');

const CATEGORY_MAP = [
  { oldId: 'cat-pakaian', newName: 'Pakaian' },
  { oldId: 'cat-tas', newName: 'Tas & Merchandise' },
  { oldId: 'cat-packaging', newName: 'Packaging' },
];

async function main() {
  console.log('🔧 [START] Migrasi Kategori Sablon\n');

  // ====================================================================
  // STEP 1: Buat 3 kategori SABLON_SERVICE yang sah
  // ====================================================================
  console.log('📦 STEP 1: Membuat kategori SABLON_SERVICE...');

  const newCategoryIds = {};

  for (const cat of CATEGORY_MAP) {
    // Cek apakah sudah ada kategori SABLON_SERVICE dengan nama yang sama
    const existing = await db('productCategory')
      .where('categoryName', cat.newName)
      .where('businessType', 'SABLON_SERVICE')
      .first();

    if (existing) {
      console.log(`   ⏭️  Kategori "${cat.newName}" sudah ada (ID: ${existing.id}). Skip.`);
      newCategoryIds[cat.oldId] = existing.id;
    } else {
      const newId = cuid();
      await db('productCategory').insert({
        id: newId,
        categoryName: cat.newName,
        description: `Kategori ${cat.newName} untuk layanan sablon custom`,
        isActive: true,
        businessType: 'SABLON_SERVICE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`   ✅ Kategori "${cat.newName}" dibuat (ID: ${newId})`);
      newCategoryIds[cat.oldId] = newId;
    }
  }

  // ====================================================================
  // STEP 2: Update categoryId semua produk sablon
  // ====================================================================
  console.log('\n🔗 STEP 2: Migrasi categoryId produk sablon...');

  for (const cat of CATEGORY_MAP) {
    const newId = newCategoryIds[cat.oldId];
    const result = await db('product')
      .where('categoryId', cat.oldId)
      .where('businessType', 'SABLON_SERVICE')
      .update({ categoryId: newId, updatedAt: new Date() });

    console.log(`   ✅ ${result} produk dari "${cat.oldId}" → "${newId}" (${cat.newName})`);
  }

  // ====================================================================
  // STEP 3: Fix trackStock = false untuk semua "Bawa Sendiri"
  // ====================================================================
  console.log('\n🛡️ STEP 3: Set trackStock = false untuk "Bawa Sendiri"...');

  const bawaSendiriResult = await db('product')
    .where('businessType', 'SABLON_SERVICE')
    .where('productName', 'Bawa Sendiri')
    .update({ trackStock: false, updatedAt: new Date() });

  console.log(`   ✅ ${bawaSendiriResult} produk "Bawa Sendiri" di-update trackStock = false`);

  // ====================================================================
  // STEP 4: Set harga = 0 untuk semua "Bawa Sendiri"
  // ====================================================================
  console.log('\n💰 STEP 4: Set harga = Rp 0 untuk "Bawa Sendiri"...');

  const priceResult = await db('product')
    .where('businessType', 'SABLON_SERVICE')
    .where('productName', 'Bawa Sendiri')
    .update({ price: 0, updatedAt: new Date() });

  console.log(`   ✅ ${priceResult} produk "Bawa Sendiri" di-update harga = 0`);

  // ====================================================================
  // VERIFICATION: Query ulang untuk memastikan
  // ====================================================================
  console.log('\n' + '='.repeat(60));
  console.log('🔍 VERIFIKASI AKHIR');
  console.log('='.repeat(60));

  const sablonCats = await db('productCategory')
    .where('businessType', 'SABLON_SERVICE')
    .select('id', 'categoryName');

  console.log('\n📁 Kategori SABLON_SERVICE di DB:');
  sablonCats.forEach(c => console.log(`   - ${c.categoryName} (${c.id})`));

  const sablonProducts = await db('product')
    .where('businessType', 'SABLON_SERVICE')
    .select('id', 'productName', 'categoryId', 'price', 'trackStock');

  console.log('\n📦 Produk SABLON_SERVICE:');
  sablonProducts.forEach(p => {
    const cat = sablonCats.find(c => c.id === p.categoryId);
    const orphaned = cat ? '' : ' ⚠️ ORPHANED!';
    const trackLabel = p.trackStock === false || p.trackStock === 0 ? '♾️ Unlimited' : '📊 Tracked';
    console.log(`   - [${cat?.categoryName || 'UNKNOWN'}] ${p.productName} | Rp ${p.price} | ${trackLabel}${orphaned}`);
  });

  const orphanCount = sablonProducts.filter(p => !sablonCats.find(c => c.id === p.categoryId)).length;

  console.log('\n' + '='.repeat(60));
  if (orphanCount === 0) {
    console.log('🎉 MIGRASI BERHASIL! 0 data yatim piatu. Semua relasi valid.');
  } else {
    console.log(`❌ MASIH ADA ${orphanCount} PRODUK ORPHAN! Periksa manual.`);
  }
  console.log('='.repeat(60));
}

main()
  .catch(err => {
    console.error('\n❌ MIGRASI GAGAL:', err.message);
    console.error(err.stack);
  })
  .finally(() => process.exit(0));

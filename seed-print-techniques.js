const knex = require('./src/config/knex');
const crypto = require('crypto');

const generateId = () => 'tech_' + crypto.randomUUID().replace(/-/g, '').substring(0, 10);

async function seedPrintTechniques() {
  try {
    console.log('🔄 Memulai proses seeding Teknik Sablon...');

    // Fetch categories to get IDs
    const categories = await knex('productCategory').select('id', 'categoryName');
    
    // Find category IDs (case insensitive search)
    const findCat = (name) => {
      const cat = categories.find(c => c.categoryName.toLowerCase().includes(name.toLowerCase()));
      return cat ? cat.id : null;
    };

    const pakaianId = findCat('pakaian');
    const tasId = findCat('tas');
    const packagingId = findCat('packaging');

    // Create array of valid category IDs for each group
    const pakaianOnly = pakaianId ? [pakaianId] : [];
    const tasOnly = tasId ? [tasId] : [];
    const packagingOnly = packagingId ? [packagingId] : [];
    const pakaianTas = [pakaianId, tasId].filter(Boolean);

    // Prepare default techniques based on user discussion
    const defaultTechniques = [
      // Pakaian & Tas (Bisa untuk keduanya)
      {
        id: generateId(),
        name: 'DTF (Full Color)',
        description: 'Teknik sablon digital full color tanpa batasan warna. Sangat cocok untuk desain kompleks atau foto. Bisa satuan.',
        allowedCategories: JSON.stringify(pakaianTas),
        minOrder: 1,
        pricingType: 'area_based',
        basePrice: 30000,
        maxColors: null,
        imageUrl: null,
        isActive: true
      },
      // Pakaian Only
      {
        id: generateId(),
        name: 'Plastisol (Sablon Manual)',
        description: 'Sablon manual standar distro. Kualitas sangat awet dan warna pekat. Khusus order massal.',
        allowedCategories: JSON.stringify(pakaianOnly),
        minOrder: 12,
        pricingType: 'color_based',
        basePrice: 15000,
        maxColors: 5,
        imageUrl: null,
        isActive: true
      },
      {
        id: generateId(),
        name: 'Rubber (Sablon Manual)',
        description: 'Sablon manual berbahan dasar air. Cocok untuk semua jenis kaos dan aman disetrika.',
        allowedCategories: JSON.stringify(pakaianOnly),
        minOrder: 12,
        pricingType: 'color_based',
        basePrice: 12000,
        maxColors: 4,
        imageUrl: null,
        isActive: true
      },
      {
        id: generateId(),
        name: 'Bordir Komputer',
        description: 'Bordir menggunakan mesin komputer untuk hasil yang presisi. Khusus logo atau tulisan padat.',
        allowedCategories: JSON.stringify(pakaianOnly),
        minOrder: 6,
        pricingType: 'area_based',
        basePrice: 10000,
        maxColors: null,
        imageUrl: null,
        isActive: true
      },
      {
        id: generateId(),
        name: 'Polyflex',
        description: 'Sablon cutting berbahan vinyl. Cocok untuk jersey olahraga, nama punggung, atau logo sederhana 1-2 warna.',
        allowedCategories: JSON.stringify(pakaianOnly),
        minOrder: 1,
        pricingType: 'color_based',
        basePrice: 15000,
        maxColors: 2,
        imageUrl: null,
        isActive: true
      },
      
      // Tas & Merchandise Only
      {
        id: generateId(),
        name: 'Sublimasi',
        description: 'Proses transfer tinta menggunakan panas. Hanya untuk bahan terang berbahan dasar polyester.',
        allowedCategories: JSON.stringify(tasOnly),
        minOrder: 1,
        pricingType: 'area_based',
        basePrice: 15000,
        maxColors: null,
        imageUrl: null,
        isActive: true
      },
      {
        id: generateId(),
        name: 'Print UV',
        description: 'Cetak langsung ke material menggunakan tinta UV. Cocok untuk botol, tumbler, atau permukaan keras.',
        allowedCategories: JSON.stringify(tasOnly),
        minOrder: 1,
        pricingType: 'area_based',
        basePrice: 20000,
        maxColors: null,
        imageUrl: null,
        isActive: true
      },

      // Packaging Only
      {
        id: generateId(),
        name: 'Sablon Plastik (Khusus Polymailer)',
        description: 'Sablon manual 1 warna khusus untuk material plastik/polymailer.',
        allowedCategories: JSON.stringify(packagingOnly),
        minOrder: 100,
        pricingType: 'color_based',
        basePrice: 500,
        maxColors: 1,
        imageUrl: null,
        isActive: true
      },
      {
        id: generateId(),
        name: 'Cetak Offset',
        description: 'Cetak presisi tinggi untuk kardus/paper bag dalam jumlah besar.',
        allowedCategories: JSON.stringify(packagingOnly),
        minOrder: 500,
        pricingType: 'fixed',
        basePrice: 1500,
        maxColors: null,
        imageUrl: null,
        isActive: true
      }
    ];

    // Clear existing if any
    await knex('print_techniques').del();
    
    // Insert new
    await knex('print_techniques').insert(defaultTechniques);
    
    console.log(`✅ Berhasil menyisipkan ${defaultTechniques.length} teknik sablon bawaan.`);

  } catch (error) {
    console.error('❌ Gagal seeding Teknik Sablon:', error);
  } finally {
    await knex.destroy();
  }
}

seedPrintTechniques();

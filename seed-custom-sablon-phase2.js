const knex = require('./src/config/knex');

async function seed() {
  try {
    // 1. Seed Portfolio Items
    const existingPortfolio = await knex('portfolio_items').first();
    if (!existingPortfolio) {
      console.log('Seeding portfolio_items...');
      await knex('portfolio_items').insert([
        { title: 'Sablon DTF - Event Kampus', category: 'Pakaian', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop' },
        { title: 'Seragam Barista - Apron Canvas', category: 'Merchandise', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800&auto=format&fit=crop' },
        { title: 'Paper Bag Custom - Brand Hijab', category: 'Packaging', image: 'https://images.unsplash.com/photo-1587522501438-e6d8a436940a?q=80&w=800&auto=format&fit=crop' },
        { title: 'Tote Bag Kanvas - Seminar', category: 'Merchandise', image: 'https://images.unsplash.com/photo-1597484661643-2f5fef640df1?q=80&w=800&auto=format&fit=crop' },
        { title: 'Hoodie Komunitas - Sablon Plastisol', category: 'Pakaian', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop' },
        { title: 'Polymailer Olshop - Sablon 1 Warna', category: 'Packaging', image: 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?q=80&w=800&auto=format&fit=crop' }
      ]);
    } else {
      console.log('portfolio_items already seeded.');
    }

    // 2. Seed FAQ Items
    const existingFaq = await knex('faq_items').first();
    if (!existingFaq) {
      console.log('Seeding faq_items...');
      await knex('faq_items').insert([
        { orderIndex: 1, question: 'Berapa minimal order untuk sablon custom?', answer: 'Sablon DTF bisa satuan tanpa minimal order. Untuk sablon Manual (Plastisol/Rubber) minimal 12 pcs agar harga lebih ekonomis.' },
        { orderIndex: 2, question: 'Bagaimana cara mengirimkan desain gambar saya?', answer: 'Setelah Anda mengisi form order ini, Anda akan langsung diarahkan ke WhatsApp kami. Anda bisa mengirimkan file resolusi tinggi (PNG, PDF, CorelDraw, atau AI) lewat WA.' },
        { orderIndex: 3, question: 'Berapa lama proses pengerjaannya?', answer: 'Normalnya proses produksi memakan waktu 7-14 hari kerja setelah DP dibayarkan dan desain/mockup disetujui.' },
        { orderIndex: 4, question: 'Apakah ada garansi jika hasil sablon rusak/luntur?', answer: 'Tentu! Kami memberikan garansi 100% cetak ulang atau retur uang jika hasil cetakan tidak sesuai dengan mockup persetujuan, atau luntur dalam pemakaian wajar sebelum 6 bulan.' },
        { orderIndex: 5, question: 'Apakah saya bisa membawa bahan/kaos sendiri?', answer: 'Sangat bisa! Anda cukup memilih opsi "Bawa Sendiri" pada pilihan produk di atas. Anda cukup membayar jasa sablonnya saja.' }
      ]);
    } else {
      console.log('faq_items already seeded.');
    }

    // 3. Seed Print Techniques
    const existingPrintTech = await knex('print_techniques').first();
    if (!existingPrintTech) {
      console.log('Seeding print_techniques...');
      await knex('print_techniques').insert([
        { name: 'DTF', characteristics: 'Full color, gradasi halus, resolusi tinggi (1440dpi)', cons: 'Harga relatif lebih tinggi untuk ukuran besar', basePrice: 15000, pricePerColor: 0, minOrder: 1, isManual: false },
        { name: 'Plastisol', characteristics: 'Warna sangat solid, awet bertahun-tahun, tekstur karet', cons: 'Terbatas untuk desain solid (bukan foto/gradasi)', basePrice: 25000, pricePerColor: 5000, minOrder: 12, isManual: true },
        { name: 'Rubber', characteristics: 'Manual Solid', cons: 'Kurang awet dibanding plastisol', basePrice: 20000, pricePerColor: 4000, minOrder: 12, isManual: true },
        { name: 'Polyflex', characteristics: 'Hasil matte/glossy presisi, cocok untuk nama/nomor', cons: 'Tidak cocok untuk desain dengan banyak detail kecil', basePrice: 10000, pricePerColor: 0, minOrder: 1, isManual: false }
      ]);
    } else {
      console.log('print_techniques already seeded.');
    }

    console.log('Phase 2 Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();

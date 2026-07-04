const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/pages/DesignRequest.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// The translation mapping
const translations = `
const TR = {
  ID: {
    hero: {
      title1: 'Bring Your Design',
      title2: 'To Life.',
      desc: 'Layanan sablon premium untuk merchandise event, seragam komunitas, atau brand clothing Anda. Kualitas distro, proses transparan, garansi 100%.',
      cta: 'Mulai Konsultasi (Gratis)',
      price: 'Harga mulai dari Rp 55.000/pcs*'
    },
    guarantee: {
      title1: 'Garansi Sablon',
      desc1: 'Hasil tidak sesuai mockup? Cetak ulang GRATIS. Tinta luntur? Garansi tukar baru hingga 6 bulan.',
      title2: 'Tepat Waktu',
      desc2: 'Manajemen produksi ketat menjamin pesanan Anda selesai sesuai deadline. Tanpa alasan mundur.',
      title3: 'Detail Spesifik',
      desc3: 'Mockup presisi tinggi sebelum naik cetak. Anda tahu persis apa yang akan Anda dapatkan.'
    },
    portfolio: {
      title: 'Our Work',
      desc: 'Portofolio hasil produksi nyata. Kami percaya kualitas harus dibuktikan dengan hasil, bukan sekadar janji.'
    },
    materials: {
      title: 'Our Materials',
      techTitle: 'Print Techniques',
      techHead: ['Teknik', 'Karakteristik', 'Kekurangan']
    },
    workflow: {
      title: 'Workflow Proses',
      steps: [
        { title: 'Submit Form', desc: 'Lengkapi form spesifikasi dan unggah desain.' },
        { title: 'Quotation', desc: 'Kami cek & berikan estimasi harga (1x24 jam).' },
        { title: 'Mockup Approval', desc: 'Preview digital sebelum produksi massal (1-2 hari).' },
        { title: 'Production', desc: 'Produksi dikerjakan presisi (7-10 hari kerja).' }
      ]
    },
    form: {
      title: 'Mulai Pesanan Custom',
      desc: 'Isi detail di bawah seakurat mungkin untuk penawaran terbaik',
      loginRequired: 'Login Diperlukan',
      loginDesc: 'Untuk alasan keamanan transaksi, riwayat penawaran harga, dan pelacakan progress secara real-time, Anda diwajibkan untuk masuk atau mendaftar akun terlebih dahulu sebelum mengajukan pesanan custom.',
      loginBtn: 'Login',
      registerBtn: 'Daftar Baru',
      step1: '1. Informasi Proyek',
      projName: 'Judul / Nama Proyek *',
      purpose: 'Tujuan Penggunaan *',
      deadline: 'Target Selesai (Deadline) *',
      step2: '2. Spesifikasi Produk',
      material: 'Bahan Dasar *',
      color: 'Warna Kain *',
      qty: 'Total Quantity (Pcs) *',
      sizes: 'Rincian Ukuran *',
      step3: '3. Sablon & Desain',
      tech: 'Teknik Sablon *',
      colors: 'Jumlah Warna (Khusus Manual) *',
      pos: 'Posisi Sablon *',
      upload: 'Unggah File Artwork / Mockup *',
      uploadDesc: 'Format: PNG (min 300dpi), PDF, AI, atau CDR. Maks 50MB.',
      notes: 'Catatan Khusus Desain',
      step4: '4. Kontak & Pengiriman',
      pic: 'Nama PIC *',
      wa: 'No. WhatsApp *',
      address: 'Alamat Pengiriman *',
      shipNotes: 'Catatan Ekspedisi (Opsional)',
      submit: 'Kirim Permintaan Sablon',
      terms: 'Dengan mengirimkan form ini, Anda menyetujui Syarat & Ketentuan layanan custom ARIANATION.'
    },
    success: {
      title: 'Permintaan Terkirim',
      desc: 'Terima kasih! Tim produksi kami akan segera mereview spesifikasi dan artwork Anda. Kami akan menghubungi Anda melalui WhatsApp dalam waktu 1x24 jam untuk penawaran harga.',
      btn: 'Cek Status Pesanan'
    }
  },
  EN: {
    hero: {
      title1: 'Bring Your Design',
      title2: 'To Life.',
      desc: 'Premium screen printing for event merchandise, community uniforms, or your clothing brand. Distro quality, transparent process, 100% guarantee.',
      cta: 'Start Free Consultation',
      price: 'Prices start from Rp 55.000/pcs*'
    },
    guarantee: {
      title1: 'Print Guarantee',
      desc1: 'Result doesn\\'t match mockup? FREE reprint. Faded ink? Replacement guarantee up to 6 months.',
      title2: 'On Time',
      desc2: 'Strict production management ensures your order is finished on deadline. No delays.',
      title3: 'Specific Details',
      desc3: 'High precision mockup before printing. You know exactly what you will get.'
    },
    portfolio: {
      title: 'Our Work',
      desc: 'Real production portfolio. We believe quality must be proven by results, not just promises.'
    },
    materials: {
      title: 'Our Materials',
      techTitle: 'Print Techniques',
      techHead: ['Technique', 'Characteristics', 'Cons']
    },
    workflow: {
      title: 'Process Workflow',
      steps: [
        { title: 'Submit Form', desc: 'Complete specs and upload design.' },
        { title: 'Quotation', desc: 'We check & estimate price (24 hrs).' },
        { title: 'Mockup Approval', desc: 'Digital preview before mass production (1-2 days).' },
        { title: 'Production', desc: 'Precision production (7-10 work days).' }
      ]
    },
    form: {
      title: 'Start Custom Order',
      desc: 'Fill details accurately for the best quotation',
      loginRequired: 'Login Required',
      loginDesc: 'For transaction security, quotation history, and real-time progress tracking, you must log in or register before submitting a custom order.',
      loginBtn: 'Login',
      registerBtn: 'Register',
      step1: '1. Project Info',
      projName: 'Project Name / Title *',
      purpose: 'Purpose of Use *',
      deadline: 'Target Deadline *',
      step2: '2. Product Specs',
      material: 'Base Material *',
      color: 'Fabric Color *',
      qty: 'Total Quantity (Pcs) *',
      sizes: 'Size Breakdown *',
      step3: '3. Print & Design',
      tech: 'Print Technique *',
      colors: 'Number of Colors (Manual Only) *',
      pos: 'Print Position *',
      upload: 'Upload Artwork / Mockup *',
      uploadDesc: 'Format: PNG (min 300dpi), PDF, AI, or CDR. Max 50MB.',
      notes: 'Special Design Notes',
      step4: '4. Contact & Shipping',
      pic: 'PIC Name *',
      wa: 'WhatsApp Number *',
      address: 'Shipping Address *',
      shipNotes: 'Shipping Notes (Optional)',
      submit: 'Submit Request',
      terms: 'By submitting this form, you agree to ARIANATION\\'s custom service Terms & Conditions.'
    },
    success: {
      title: 'Request Submitted',
      desc: 'Thank you! Our production team will review your specs and artwork. We will contact you via WhatsApp within 24 hours for a price quotation.',
      btn: 'Check Order Status'
    }
  }
};
`;

// Inject TR above export default function
if (!content.includes('const TR = {')) {
  content = content.replace('export default function DesignRequest() {', translations + '\\nexport default function DesignRequest() {');
}

// Extract language
if (!content.includes('const t = TR[language] || TR.ID;')) {
  content = content.replace(
    'const setLoading = useUIStore((s) => s.setLoading);',
    'const setLoading = useUIStore((s) => s.setLoading);\\n  const language = useUIStore((s) => s.language) || \\'ID\\';\\n  const t = TR[language] || TR.ID;'
  );
}

// Replace text in Hero
content = content.replace(/>Bring Your Design <\\/br> <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-black dark:from-gray-400 dark:to-white">To Life\\.<\\/span>/g, '>{t.hero.title1} <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-black dark:from-gray-400 dark:to-white">{t.hero.title2}</span>');
content = content.replace(/Layanan sablon premium untuk merchandise event, seragam komunitas, atau brand clothing Anda\\. Kualitas distro, proses transparan, garansi 100%\\./g, '{t.hero.desc}');
content = content.replace(/>Mulai Konsultasi \\(Gratis\\)</g, '>{t.hero.cta}<');
content = content.replace(/>Harga mulai dari Rp 55\\.000\\/pcs\\*</g, '>{t.hero.price}<');

// Guarantee
content = content.replace(/>Garansi Sablon</g, '>{t.guarantee.title1}<');
content = content.replace(/Hasil tidak sesuai mockup\\? Cetak ulang GRATIS\\. Tinta luntur\\? Garansi tukar baru hingga 6 bulan\\./g, '{t.guarantee.desc1}');
content = content.replace(/>Tepat Waktu</g, '>{t.guarantee.title2}<');
content = content.replace(/Manajemen produksi ketat menjamin pesanan Anda selesai sesuai deadline\\. Tanpa alasan mundur\\./g, '{t.guarantee.desc2}');
content = content.replace(/>Detail Spesifik</g, '>{t.guarantee.title3}<');
content = content.replace(/Mockup presisi tinggi sebelum naik cetak\\. Anda tahu persis apa yang akan Anda dapatkan\\./g, '{t.guarantee.desc3}');

// Portfolio
content = content.replace(/>Our Work</g, '>{t.portfolio.title}<');
content = content.replace(/Portofolio hasil produksi nyata\\. Kami percaya kualitas harus dibuktikan dengan hasil, bukan sekadar janji\\./g, '{t.portfolio.desc}');

// Materials
content = content.replace(/>Our Materials</g, '>{t.materials.title}<');
content = content.replace(/>Print Techniques</g, '>{t.materials.techTitle}<');

// Workflow
content = content.replace(/>Workflow Proses</g, '>{t.workflow.title}<');

// Forms
content = content.replace(/>Mulai Pesanan Custom</g, '>{t.form.title}<');
content = content.replace(/>Isi detail di bawah seakurat mungkin untuk penawaran terbaik</g, '>{t.form.desc}<');
content = content.replace(/>Login Diperlukan</g, '>{t.form.loginRequired}<');
content = content.replace(/Untuk alasan keamanan transaksi, riwayat penawaran harga, dan pelacakan \\*progress\\* secara real-time, Anda diwajibkan untuk masuk atau mendaftar akun terlebih dahulu sebelum mengajukan pesanan custom\\./g, '{t.form.loginDesc}');
content = content.replace(/>Login</g, '>{t.form.loginBtn}<');
content = content.replace(/>Daftar Baru</g, '>{t.form.registerBtn}<');

content = content.replace(/>1\\. Informasi Proyek</g, '>{t.form.step1}<');
content = content.replace(/>Judul \/ Nama Proyek \\*</g, '>{t.form.projName}<');
content = content.replace(/>Tujuan Penggunaan \\*</g, '>{t.form.purpose}<');
content = content.replace(/>Target Selesai \\(Deadline\\) \\*</g, '>{t.form.deadline}<');

content = content.replace(/>2\\. Spesifikasi Produk</g, '>{t.form.step2}<');
content = content.replace(/>Bahan Dasar \\*</g, '>{t.form.material}<');
content = content.replace(/>Warna Kain \\*</g, '>{t.form.color}<');
content = content.replace(/>Total Quantity \\(Pcs\\) \\*</g, '>{t.form.qty}<');
content = content.replace(/>Rincian Ukuran \\*</g, '>{t.form.sizes}<');

content = content.replace(/>3\\. Sablon & Desain</g, '>{t.form.step3}<');
content = content.replace(/>Teknik Sablon \\*</g, '>{t.form.tech}<');
content = content.replace(/>Jumlah Warna \\(Khusus Manual\\) \\*</g, '>{t.form.colors}<');
content = content.replace(/>Posisi Sablon \\*</g, '>{t.form.pos}<');
content = content.replace(/>Unggah File Artwork \/ Mockup \\*</g, '>{t.form.upload}<');
content = content.replace(/>Format: PNG \\(min 300dpi\\), PDF, AI, atau CDR\\. Maks 50MB\\.</g, '>{t.form.uploadDesc}<');
content = content.replace(/>Catatan Khusus Desain</g, '>{t.form.notes}<');

content = content.replace(/>4\\. Kontak & Pengiriman</g, '>{t.form.step4}<');
content = content.replace(/>Nama PIC \\*</g, '>{t.form.pic}<');
content = content.replace(/>No\\. WhatsApp \\*</g, '>{t.form.wa}<');
content = content.replace(/>Alamat Pengiriman \\*</g, '>{t.form.address}<');
content = content.replace(/>Catatan Ekspedisi \\(Opsional\\)</g, '>{t.form.shipNotes}<');
content = content.replace(/>Kirim Permintaan Sablon</g, '>{t.form.submit}<');
content = content.replace(/>Dengan mengirimkan form ini, Anda menyetujui Syarat & Ketentuan layanan custom ARIANATION\\.</g, '>{t.form.terms}<');

content = content.replace(/>Permintaan Terkirim</g, '>{t.success.title}<');
content = content.replace(/Terima kasih! Tim produksi kami akan segera mereview spesifikasi dan artwork Anda\\. Kami akan menghubungi Anda melalui WhatsApp dalam waktu 1x24 jam untuk penawaran harga\\./g, '{t.success.desc}');
content = content.replace(/>Cek Status Pesanan</g, '>{t.success.btn}<');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Translations injected successfully!');

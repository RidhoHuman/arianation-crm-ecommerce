import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rnd } from 'react-rnd';
import * as htmlToImage from 'html-to-image';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';
import api from '../services/api';
import SEOHead from '../components/SEOHead';
import Breadcrumb from '../components/Breadcrumb';
import useCategoryStore from '../store/categoryStore';
import usePrintTechniqueStore from '../store/printTechniqueStore';

const ProductImageCarousel = ({ product, className = "w-12 h-12 object-cover rounded-md" }) => {
  let allImages = [];

  if (product?.imageUrl) allImages.push(product.imageUrl);

  let parsedImageUrls = [];
  try {
    parsedImageUrls = typeof product?.imageUrls === 'string' ? JSON.parse(product?.imageUrls) : (product?.imageUrls || []);
  } catch (e) { }

  parsedImageUrls.forEach(img => {
    if (img && !allImages.includes(img)) allImages.push(img);
  });

  const isServiceOnly = product?.productName?.toLowerCase().includes('bawa sendiri');

  if (!isServiceOnly && product?.variants && product.variants.length > 0) {
    product.variants.forEach(v => {
      if (v.imageUrl && !allImages.includes(v.imageUrl)) allImages.push(v.imageUrl);
      if (v.imageUrlBack && !allImages.includes(v.imageUrlBack)) allImages.push(v.imageUrlBack);
      if (v.imageUrlLeft && !allImages.includes(v.imageUrlLeft)) allImages.push(v.imageUrlLeft);
      if (v.imageUrlRight && !allImages.includes(v.imageUrlRight)) allImages.push(v.imageUrlRight);
    });
  }

  // If we have actual uploaded images, remove the unsplash placeholder
  const actualImages = allImages.filter(img => !img.includes('unsplash.com'));
  let finalImages = actualImages.length > 0 ? actualImages : allImages;

  if (isServiceOnly && finalImages.length > 0) {
    finalImages = [finalImages[0]];
  }

  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (finalImages.length > 1 && !isServiceOnly) {
      const timer = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % finalImages.length);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [finalImages.length, isServiceOnly]);

  const objectFit = className.includes('object-contain') ? 'object-contain' : 'object-cover';

  if (finalImages.length === 0) {
    const fallbackImage = product?.categoryId?.includes('tas') ? 'https://images.unsplash.com/photo-1597484661643-2f5fef640df1?q=80&w=800&auto=format&fit=crop' :
      product?.categoryId?.includes('packaging') ? 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?q=80&w=800&auto=format&fit=crop' :
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop';
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img src={fallbackImage} alt={product?.productName || 'Product'} className={`absolute inset-0 w-full h-full ${objectFit} opacity-80`} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {finalImages.map((img, idx) => {
        let url = img;
        if (img && !img.startsWith('http')) {
          const cleanImg = img.startsWith('/') ? img : `/${img}`;
          url = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') + cleanImg : cleanImg;
        }
        return (
          <img
            key={idx}
            src={url}
            alt={product.productName || 'Product'}
            className={`absolute inset-0 w-full h-full ${objectFit} transition-opacity duration-1000 ${idx === currentIndex ? 'opacity-100' : 'opacity-0'}`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop';
            }}
          />
        );
      })}
      {finalImages.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1.5 z-10">
          {finalImages.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-black dark:bg-white' : 'w-1.5 bg-gray-400/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FAQ_ITEMS = [
  { q: 'Berapa minimal order untuk sablon custom?', a: 'Sablon DTF bisa satuan tanpa minimal order. Untuk sablon Manual (Plastisol/Rubber) minimal 12 pcs agar harga lebih ekonomis.' },
  { q: 'Bagaimana cara mengirimkan desain gambar saya?', a: 'Setelah Anda mengisi form order ini, Anda akan langsung diarahkan ke WhatsApp kami. Anda bisa mengirimkan file resolusi tinggi (PNG, PDF, CorelDraw, atau AI) lewat WA.' },
  { q: 'Berapa lama proses pengerjaannya?', a: 'Normalnya proses produksi memakan waktu 7-14 hari kerja setelah DP dibayarkan dan desain/mockup disetujui.' },
  { q: 'Apakah ada garansi jika hasil sablon rusak/luntur?', a: 'Tentu! Kami memberikan garansi 100% cetak ulang atau retur uang jika hasil cetakan tidak sesuai dengan mockup persetujuan, atau luntur dalam pemakaian wajar sebelum 6 bulan.' },
  { q: 'Apakah saya bisa membawa bahan/kaos sendiri?', a: 'Sangat bisa! Anda cukup memilih opsi "Bawa Sendiri" pada pilihan produk di atas. Anda cukup membayar jasa sablonnya saja.' }
];

const TR = {
  ID: {
    hero: {
      title1: 'Wujudkan Desain',
      title2: 'Impian Anda.',
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
      title: 'Karya Kami',
      desc: 'Portofolio hasil produksi nyata. Kami percaya kualitas harus dibuktikan dengan hasil, bukan sekadar janji.'
    },
    materials: {
      title: 'Material Kami',
      techTitle: 'Print Techniques',
      techHead: ['Teknik', 'Karakteristik', 'Kekurangan']
    },
    workflow: {
      title: 'Workflow Proses',
      steps: [
        { title: 'Submit Form', desc: 'Lengkapi form spesifikasi dan unggah desain.' },
        { title: 'Quotation', desc: 'Kami cek & berikan estimasi harga (1x24 jam).' },
        { title: 'Mockup Approval', desc: 'Preview digital sebelum produksi massal (1-2 hari).' },
        { title: 'Production', desc: 'Proses produksi massal berjalan (7-14 hari kerja, belum termasuk waktu pengiriman reguler).' }
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
      step3: '3. Teknis Sablon & Desain',
      tech: 'Teknik Sablon *',
      colors: 'Estimasi Jumlah Warna *',
      pos: 'Posisi Sablon *',
      upload: 'Unggah File Artwork / Mockup *',
      posOptions: [
        'Dada Kiri (Logo)',
        'Dada Kanan (Logo)',
        'Dada Tengah (Medium)',
        'Full Depan (A4/A3)',
        'Punggung Belakang (A4/A3)',
        'Lengan Kiri',
        'Lengan Kanan',
        'Tengkuk Leher (Neck label)'
      ],
      colorOptions: [
        'Hitam', 'Putih', 'Navy', 'Maroon', 'Abu Misty', 'Hijau Botol', 'Custom / Lainnya', 'Rekomendasikan Warna Terbaik'
      ],
      uploadDesc: 'Format: PNG, PDF, AI, CDR. Jika >1 file, harap jadikan .ZIP. Maks 50MB.',
      notes: 'Catatan Khusus Desain',
      step4: '4. Kontak & Pengiriman',
      pic: 'Nama PIC *',
      wa: 'No. WhatsApp *',
      address: 'Alamat Pengiriman *',
      shipNotes: 'Catatan Ekspedisi (Opsional)',
      submit: 'Kirim Permintaan Sablon',
      disclaimerTitle: 'Perhatian: Waktu Produksi ≠ Waktu Pengiriman',
      disclaimer: 'Estimasi pengerjaan sablon adalah 7-14 hari kerja setelah desain disetujui. Estimasi ini murni untuk proses produksi dan belum termasuk lama waktu pengiriman oleh ekspedisi menuju lokasi Anda.',
      terms: 'Dengan mengirimkan form ini, Anda menyetujui Syarat & Ketentuan layanan custom ARIANATION.',
      errors: {
        title: 'Judul proyek wajib diisi',
        purpose: 'Tujuan penggunaan wajib diisi',
        deadline: 'Target selesai wajib diisi',
        material: 'Pilih jenis bahan dasar',
        qtyMin: 'Minimal order 1 pcs',
        qtyManual: 'Sablon manual minimal 12 pcs',
        sizes: 'Rincian ukuran wajib diisi (misal: S:3, M:5)',
        color: 'Warna kaos wajib diisi',
        pos: 'Posisi sablon wajib diisi',
        tech: 'Teknik sablon wajib dipilih',
        colors: 'Jumlah warna wajib diisi',
        pic: 'Nama PIC wajib diisi',
        wa: 'Nomor WhatsApp valid wajib diisi',
        address: 'Alamat pengiriman wajib diisi'
      }
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
      desc1: "Result doesn't match mockup? FREE reprint. Faded ink? Replacement guarantee up to 6 months.",
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
        { title: 'Production', desc: 'Mass production process (7-14 working days, excluding regular shipping time).' }
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
      colors: 'Estimated Number of Colors *',
      pos: 'Print Position *',
      upload: 'Upload Artwork / Mockup *',
      posOptions: [
        'Follow Attached Mockup',
        'Left Chest (Logo)',
        'Right Chest (Logo)',
        'Center Chest (Medium)',
        'Full Front (A4/A3)',
        'Full Back (A4/A3)',
        'Left Sleeve',
        'Right Sleeve',
        'Neck Label'
      ],
      colorOptions: [
        'Black', 'White', 'Navy', 'Maroon', 'Misty Grey', 'Bottle Green', 'Custom / Other', 'Recommend Best Color'
      ],
      uploadDesc: 'Format: PNG, PDF, AI, CDR. If >1 file, please .ZIP them. Max 50MB.',
      notes: 'Special Design Notes',
      step4: '4. Contact & Shipping',
      pic: 'PIC Name *',
      wa: 'WhatsApp Number *',
      address: 'Shipping Address *',
      shipNotes: 'Shipping Notes (Optional)',
      submit: 'Submit Request',
      disclaimerTitle: 'Attention: Production Time ≠ Shipping Time',
      disclaimer: 'The estimated production time is 7-14 working days after design approval. This estimate is purely for the production process and does not include the shipping time by the courier to your location.',
      terms: "By submitting this form, you agree to ARIANATION's custom service Terms & Conditions.",
      errors: {
        title: 'Project title is required',
        purpose: 'Purpose of use is required',
        deadline: 'Target deadline is required',
        material: 'Please select base material',
        qtyMin: 'Minimum order is 1 pc',
        qtyManual: 'Manual printing requires at least 12 pcs',
        sizes: 'Size breakdown is required (e.g. S:3, M:5)',
        color: 'Fabric color is required',
        pos: 'Print position is required',
        tech: 'Please select print technique',
        colors: 'Number of colors is required',
        pic: 'PIC Name is required',
        wa: 'Valid WhatsApp number is required',
        address: 'Shipping address is required'
      }
    },
    success: {
      title: 'Request Submitted',
      desc: 'Thank you! Our production team will review your specs and artwork. We will contact you via WhatsApp within 24 hours for a price quotation.',
      btn: 'Check Order Status'
    }
  }
};

// Variants for framer motion
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

export default function DesignRequest() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const setNavbarTheme = useUIStore(state => state.setNavbarTheme);
  const { categories, fetchCategories } = useCategoryStore();
  const { techniques: printTechniques, fetchTechniquesPublic } = usePrintTechniqueStore();

  const [portfolioItems, setPortfolioItems] = useState([]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await api.get('/portfolio?limit=6');
        if (res.data?.data) {
          setPortfolioItems(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching portfolio:', err);
      }
    };
    fetchPortfolio();
  }, []);

  const setLoading = useUIStore((s) => s.setLoading);
  const language = useUIStore((s) => s.language) || 'ID';
  const [customProducts, setCustomProducts] = useState([]);
  const [faqItems, setFaqItems] = useState(FAQ_ITEMS);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const fetchCustomProducts = React.useCallback(async () => {
    try {
      const res = await api.get('/products?businessType=SABLON_SERVICE&limit=1000');
      if (res.data?.success) {
        setCustomProducts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch custom products', err);
    }
  }, []);

  // Fetch custom products and categories on mount
  useEffect(() => {
    fetchCustomProducts();
    fetchCategories();
    fetchTechniquesPublic();

    const fetchData = async () => {
      try {
        const [faqRes] = await Promise.all([
          api.get('/design-info/faqs').catch(() => ({ data: {} }))
        ]);

        if (faqRes.data?.success && faqRes.data.data.length > 0) setFaqItems(faqRes.data.data);

      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchData();
  }, [fetchCategories, fetchCustomProducts, fetchTechniquesPublic]);

  const t = TR[language] || TR.ID;

  const [file, setFile] = useState(null); // Deprecated, kept for submit compatibility
  const [previewUrl, setPreviewUrl] = useState(null);
  const mockupRef = React.useRef(null);

  const SIDES = ['Depan', 'Belakang', 'Kiri', 'Kanan'];
  const [activeSide, setActiveSide] = useState('Depan');
  const [designs, setDesigns] = useState({
    Depan: { file: null, previewUrl: null, rnd: { x: 125, y: 150, width: 150, height: 150 } },
    Belakang: { file: null, previewUrl: null, rnd: { x: 125, y: 150, width: 150, height: 150 } },
    Kiri: { file: null, previewUrl: null, rnd: { x: 125, y: 150, width: 150, height: 150 } },
    Kanan: { file: null, previewUrl: null, rnd: { x: 125, y: 150, width: 150, height: 150 } }
  });

  // Derive categories dynamically based on customProducts and global categories store
  const sablonCategories = React.useMemo(() => {
    const defaultCats = ['Pakaian', 'Tas & Merchandise', 'Packaging'];
    if (!customProducts.length || !categories.length) return defaultCats;
    const usedCategoryIds = [...new Set(customProducts.map(p => p.categoryId))];
    const catNames = usedCategoryIds.map(id => categories.find(c => c.id === id)?.categoryName).filter(Boolean);
    if (catNames.length === 0) return defaultCats;
    // Sort to keep 'Pakaian' first if it exists
    return catNames.sort((a, b) => a === 'Pakaian' ? -1 : b === 'Pakaian' ? 1 : a.localeCompare(b));
  }, [customProducts, categories]);

  const [activeCategory, setActiveCategory] = useState('Pakaian');
  const [specModalProduct, setSpecModalProduct] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);



  // getAvailableColors now derives entirely from variants
  const getAvailableColors = (productData, category) => {
    if (!productData) return [];
    if (productData.variants && productData.variants.length > 0) {
      // Map variants to unique colors
      const uniqueColors = [];
      productData.variants.forEach(v => {
        if (v.color && v.colorCode) {
          if (!uniqueColors.find(c => c.name.toLowerCase() === v.color.toLowerCase())) {
            uniqueColors.push({ name: v.color, hex: v.colorCode });
          }
        }
      });
      if (uniqueColors.length > 0) return uniqueColors;
    }

    // Fallback if no variants are set
    return [];
  };

  const getMockupImage = (productData, colorName, side) => {
    if (!productData || !side) return null;

    let matchedImage = null;

    if (productData.variants && productData.variants.length > 0) {
      // Find variant by color
      let matchedVariant = null;
      if (colorName) {
        matchedVariant = productData.variants.find(v => v.color && v.color.toLowerCase() === colorName.toLowerCase());
      }
      if (!matchedVariant) {
        matchedVariant = productData.variants[0]; // fallback to first variant
      }

      if (matchedVariant) {
        matchedImage = side === 'Belakang' ? matchedVariant.imageUrlBack :
          side === 'Kiri' ? matchedVariant.imageUrlLeft :
            side === 'Kanan' ? matchedVariant.imageUrlRight :
              matchedVariant.imageUrl;

        // Fallback: Jika sisi yang dipilih kosong, gunakan gambar varian yang tersedia (agar tidak kembali ke warna putih/default)
        if (!matchedImage) {
          matchedImage = matchedVariant.imageUrl ||
            matchedVariant.imageUrlBack ||
            matchedVariant.imageUrlLeft ||
            matchedVariant.imageUrlRight;
        }
      }
    }

    // Fallback to main product images if variant didn't provide one for "Depan"
    if (!matchedImage && side === 'Depan') {
      let parsedImageUrls = [];
      try {
        parsedImageUrls = typeof productData.imageUrls === 'string' ? JSON.parse(productData.imageUrls) : (productData.imageUrls || []);
      } catch (e) { }
      matchedImage = productData.imageUrl || parsedImageUrls[0];
    }

    if (matchedImage) {
      if (matchedImage.startsWith('/')) {
        return import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') + matchedImage : matchedImage;
      }
      return matchedImage;
    }

    return null;
  };
  const [customColor, setCustomColor] = useState('');



  const [fileError, setFileError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const designSchema = React.useMemo(() => z.object({
    designTitle: z.string().min(3, t.form.errors.title),
    purpose: z.string().min(2, t.form.errors.purpose),
    deadline: z.string().min(1, t.form.errors.deadline),
    productTypeForSablon: z.string().min(1, t.form.errors.material),
    quantity: z.number().min(1, t.form.errors.qtyMin),
    sizeBreakdown: z.string().min(1, t.form.errors.sizes),
    colorPreferences: z.string().min(2, t.form.errors.color),
    printPosition: z.string().min(1, t.form.errors.pos),
    printTechnique: z.string().min(1, t.form.errors.tech),
    numberOfColors: z.number().optional(),
    picName: z.string().min(2, t.form.errors.pic),
    whatsappNumber: z.string().min(9, t.form.errors.wa),
    shippingAddress: z.string().min(10, t.form.errors.address),
    shippingNotes: z.string().optional(),
    designDescription: z.string().optional(),
  }).superRefine((data, ctx) => {
    const isManual = data.printTechnique === 'Plastisol' || data.printTechnique === 'Rubber';
    if (isManual && data.quantity < 12) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t.form.errors.qtyManual,
        path: ['quantity']
      });
    }
  }), [t]);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(designSchema),
    defaultValues: {
      quantity: 1,
      productTypeForSablon: '',
      printTechnique: 'DTF',
      numberOfColors: 1,
      sizeBreakdown: '',
    }
  });

  const currentProduct = watch('productTypeForSablon');
  const currentColor = watch('colorPreferences');
  const printTechnique = watch('printTechnique');
  const selectedTech = React.useMemo(() => printTechniques.find(t => t.name === printTechnique), [printTechniques, printTechnique]);

  useEffect(() => {
    // Dynamically get products for current category
    const getCatName = (p) => {
      const cat = categories.find(c => c.id === p.categoryId);
      return cat ? (cat.categoryName || cat.name || '') : '';
    };

    const productsInCat = customProducts.filter(p => {
      const catId = p.categoryId || '';
      if (activeCategory === 'Pakaian' && catId === 'cat-pakaian') return true;
      if (activeCategory === 'Tas & Merchandise' && catId === 'cat-tas') return true;
      if (activeCategory === 'Packaging' && catId === 'cat-packaging') return true;

      const catName = getCatName(p);
      return catName === activeCategory ||
        (activeCategory === 'Pakaian' && catName.toLowerCase().includes('pakaian')) ||
        (activeCategory === 'Tas & Merchandise' && (catName.toLowerCase().includes('tas') || catName.toLowerCase().includes('merch'))) ||
        (activeCategory === 'Packaging' && catName.toLowerCase().includes('packaging'));
    });

    if (productsInCat.length > 0) {
      const isCurrentValid = productsInCat.find(p => p.id === currentProduct);
      if (!isCurrentValid) {
        setValue('productTypeForSablon', productsInCat[0].id, { shouldValidate: true });
      }
    }
  }, [activeCategory, currentProduct, setValue, customProducts, categories]);

  useEffect(() => {
    if (currentProduct) {
      const productData = customProducts.find(p => p.id === currentProduct);
      const availableColors = getAvailableColors(productData, activeCategory);
      const isColorValid = availableColors.some(c => c.name === currentColor);
      if (!isColorValid && availableColors.length > 0) {
        setValue('colorPreferences', availableColors[0].name, { shouldValidate: true });
      }
    }
  }, [currentProduct, activeCategory, currentColor, setValue, customProducts]);

  const handleCategoryChange = (newCategory) => {
    setActiveCategory(newCategory);
    setCustomColor('');
    setValue('colorPreferences', '', { shouldValidate: true });
    setValue('productTypeForSablon', '', { shouldValidate: true });
    setSizes({ S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 });
    setValue('quantity', 0, { shouldValidate: true });
  };

  const [sizes, setSizes] = useState({ S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 });

  useEffect(() => {
    const total = Object.values(sizes).reduce((acc, val) => acc + (parseInt(val) || 0), 0);
    setValue('quantity', total, { shouldValidate: total > 0 });

    const breakdown = Object.entries(sizes)
      .filter(([size, qty]) => parseInt(qty) > 0)
      .map(([size, qty]) => `${size}: ${qty}`)
      .join(', ');

    setValue('sizeBreakdown', breakdown || '', { shouldValidate: total > 0 });
  }, [sizes, setValue]);

  const handleSizeChange = (size, value) => {
    setSizes(prev => ({ ...prev, [size]: Math.max(0, parseInt(value) || 0) }));
  };

  const [selectedPositions, setSelectedPositions] = useState([]);

  useEffect(() => {
    setValue('printPosition', selectedPositions.join(', '), { shouldValidate: selectedPositions.length > 0 });
  }, [selectedPositions, setValue]);

  const handlePositionToggle = (pos) => {
    setSelectedPositions(prev =>
      prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
    );
  };

  const handleFileChange = (e, side = activeSide) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf', 'application/zip', 'application/x-zip-compressed'];
      const isAiOrCdr = selectedFile.name.toLowerCase().endsWith('.cdr') || selectedFile.name.toLowerCase().endsWith('.ai');

      if (!allowedTypes.includes(selectedFile.type) && !isAiOrCdr) {
        setFileError(language === 'EN' ? 'Unsupported format. Please upload PNG/JPG/PDF/AI/CDR/ZIP.' : 'Format file tidak didukung. Harap unggah PNG/JPG/PDF/AI/CDR/ZIP.');
        return;
      }

      if (selectedFile.size > 50 * 1024 * 1024) {
        setFileError(language === 'EN' ? 'File size exceeds 50MB limit' : 'Ukuran file melebihi batas 50MB');
      } else {
        setFileError('');
        const preview = selectedFile.type.startsWith('image/') ? URL.createObjectURL(selectedFile) : null;
        setDesigns(prev => ({
          ...prev,
          [side]: {
            ...prev[side],
            file: selectedFile,
            previewUrl: preview
          }
        }));
        if (side === 'Depan') {
          setFile(selectedFile);
          setPreviewUrl(preview);
        }
      }
    }
  };

  const onSubmit = async (data) => {
    if (!isAuthenticated) return;
    if (!file && !Object.values(designs).some(d => d.file)) {
      setFileError(language === 'EN' ? 'Design file is required' : 'File desain wajib diunggah');
      return;
    }

    try {
      setLoading(true);
      setSubmitError('');

      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      });

      const canvasMetadata = {};
      SIDES.forEach(side => {
        if (designs[side].file) {
          formData.append(`canvasFile_${side}`, designs[side].file);
          canvasMetadata[side] = designs[side].rnd;
        }
      });
      formData.append('canvasMetadata', JSON.stringify(canvasMetadata));

      if (file) {
        formData.append('designFile', file);
      }

      if (mockupRef.current) {
        try {
          const blob = await htmlToImage.toBlob(mockupRef.current, { quality: 0.95 });
          if (blob) {
            formData.append('mockupPreview', blob, 'mockup-preview.jpg');
          }
        } catch (snapErr) {
          console.error('Error snapping mockup:', snapErr);
        }
      }

      await api.post('/orders/custom-sablon', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      navigate('/account?tab=orders');
    } catch (err) {
      setSubmitError(err.response?.data?.message || (language === 'EN' ? 'Failed to submit design request' : 'Gagal mengirim permintaan desain'));
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 mt-16 mb-24 text-center">
        <div className="w-20 h-20 bg-aria-charcoal text-white rounded-full flex items-center justify-center mx-auto mb-8">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h2 className="text-3xl font-display font-medium uppercase tracking-widest text-aria-charcoal dark:text-white mb-4">
          {t.success.title}
        </h2>
        <p className="text-sm text-gray-500 uppercase tracking-widest leading-relaxed max-w-lg mx-auto mb-10">
          {t.success.desc}
        </p>
        <Link to="/account?tab=sablon" className="inline-block border border-aria-charcoal dark:border-white px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-aria-charcoal hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
          {t.success.btn}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <SEOHead title="Custom Sablon & Merchandise | Arianation" description={t.hero.desc} />

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tight mb-6">
              {t.hero.title1} <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-black dark:from-gray-400 dark:to-white">{t.hero.title2}</span>
            </h1>
            <p className="max-w-2xl mx-auto text-sm md:text-base text-gray-600 dark:text-gray-400 uppercase tracking-widest leading-relaxed mb-10">
              {t.hero.desc}
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <a href="#form-section" className="bg-aria-charcoal text-white dark:bg-white dark:text-black px-10 py-5 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-black transition-colors w-full sm:w-auto">
                {t.hero.cta}
              </a>
              <div className="text-xs text-gray-500 uppercase tracking-widest">
                {t.hero.price}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Abstract Background Elements */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-gray-100 dark:bg-gray-900 rounded-full blur-3xl opacity-50 -z-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-50 dark:bg-gray-800 rounded-full blur-3xl opacity-50 -z-10"></div>
      </section>

      {/* Trust & Guarantee Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="w-16 h-16 mx-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-widest mb-3">{t.guarantee.title1}</h3>
              <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">
                {t.guarantee.desc1}
              </p>
            </div>
            <div>
              <div className="w-16 h-16 mx-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-widest mb-3">{t.guarantee.title2}</h3>
              <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">
                {t.guarantee.desc2}
              </p>
            </div>
            <div>
              <div className="w-16 h-16 mx-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-widest mb-3">{t.guarantee.title3}</h3>
              <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">
                {t.guarantee.desc3}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Showcase */}
      <section className="py-24 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-display font-medium uppercase tracking-widest mb-4">{t.portfolio.title}</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest max-w-2xl mx-auto">
              {t.portfolio.desc}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {portfolioItems.map((item) => {
              let url = item.imageUrl || item.image;
              if (url && !url.startsWith('http')) {
                const cleanImg = url.startsWith('/') ? url : `/${url}`;
                url = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') + cleanImg : cleanImg;
              }
              return (
                <div key={item.id} className="relative aspect-square group overflow-hidden bg-gray-100">
                  <img src={url} alt={item.title} className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-2">{item.category}</span>
                    <h3 className="text-white text-lg font-medium">{item.title}</h3>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Materials & Print Techniques */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

            {/* Material Guide */}
            <div>
              <h2 className="text-xl font-display font-medium uppercase tracking-widest mb-8 border-b border-gray-300 dark:border-gray-700 pb-4">{t.materials.title}</h2>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black p-5">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-1">Cotton Combed 30s</h3>
                  <p className="text-xs text-gray-500 mb-3">Standar distro premium. Gramasi 140-150gsm. Adem, menyerap keringat, anti-pilling.</p>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600">Best Seller</span>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black p-5">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-1">Cotton Combed 24s</h3>
                  <p className="text-xs text-gray-500 mb-3">Lebih tebal dari 30s (170-180gsm). Tidak menerawang, jatuh lebih tegas di badan, awet.</p>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600">Heavyweight</span>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black p-5">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-1">Cotton Bamboo</h3>
                  <p className="text-xs text-gray-500 mb-3">Ultra soft, anti-bakteri alami, sangat nyaman untuk iklim tropis dan olahraga ringan.</p>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Premium</span>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black p-5">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-1">Lacoste (Polo)</h3>
                  <p className="text-xs text-gray-500 mb-3">Bahan berpori klasik untuk kaos kerah/polo. Terlihat formal, rapi, dan profesional.</p>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Formal</span>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black p-5">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-1">Fleece (Hoodie/Sweater)</h3>
                  <p className="text-xs text-gray-500 mb-3">Tebal dan hangat namun tetap bernapas. Bagian dalam berbulu halus, bagian luar licin.</p>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600">Outerwear</span>
                </div>
              </div>
            </div>

            {/* Technique Guide */}
            <div>
              <h2 className="text-xl font-display font-medium uppercase tracking-widest mb-8 border-b border-gray-300 dark:border-gray-700 pb-4">{t.materials.techTitle}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-300 dark:border-gray-700">
                      <th className="py-4 font-semibold uppercase tracking-wider text-xs">{t.materials.techHead[0]}</th>
                      <th className="py-4 font-semibold uppercase tracking-wider text-xs">{t.materials.techHead[1]}</th>
                      <th className="py-4 font-semibold uppercase tracking-wider text-xs">{t.materials.techHead[2]}</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-600 dark:text-gray-400">
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <td className="py-4 font-semibold text-black dark:text-white">DTF (Direct to Film)</td>
                      <td className="py-4">Full color, gradasi halus, resolusi tinggi (1440dpi)</td>
                      <td className="py-4">Harga relatif lebih tinggi untuk ukuran besar</td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <td className="py-4 font-semibold text-black dark:text-white">Plastisol (Manual)</td>
                      <td className="py-4">Warna sangat solid, awet bertahun-tahun, tekstur karet</td>
                      <td className="py-4">Terbatas untuk desain solid (bukan foto/gradasi)</td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <td className="py-4 font-semibold text-black dark:text-white">Polyflex</td>
                      <td className="py-4">Hasil matte/glossy presisi, cocok untuk nama/nomor</td>
                      <td className="py-4">Tidak cocok untuk desain dengan banyak detail kecil</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-display font-medium uppercase tracking-widest mb-16">{t.workflow.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-black dark:border-white flex items-center justify-center mx-auto mb-4 font-bold">1</div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2">{t.workflow.steps[0].title}</h3>
              <p className="text-xs text-gray-500">{t.workflow.steps[0].desc}</p>
              <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-[1px] bg-gray-300 dark:bg-gray-700"></div>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-black dark:border-white flex items-center justify-center mx-auto mb-4 font-bold">2</div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2">{t.workflow.steps[1].title}</h3>
              <p className="text-xs text-gray-500">{t.workflow.steps[1].desc}</p>
              <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-[1px] bg-gray-300 dark:bg-gray-700"></div>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-black dark:border-white flex items-center justify-center mx-auto mb-4 font-bold">3</div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2">{t.workflow.steps[2].title}</h3>
              <p className="text-xs text-gray-500">{t.workflow.steps[2].desc}</p>
              <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-[1px] bg-gray-300 dark:bg-gray-700"></div>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-black dark:border-white flex items-center justify-center mx-auto mb-4 font-bold bg-black text-white dark:bg-white dark:text-black">4</div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2">{t.workflow.steps[3].title}</h3>
              <p className="text-xs text-gray-500">{t.workflow.steps[3].desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Form Section */}
      <section id="form-section" className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-8 md:p-12 shadow-sm">
            <h2 className="text-2xl font-display font-medium uppercase tracking-widest mb-2 text-center">{t.form.title}</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest text-center mb-12">{t.form.desc}</p>

            {!isAuthenticated ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 p-8">
                <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <h3 className="text-lg font-bold uppercase tracking-widest mb-4">{t.form.loginRequired}</h3>
                <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
                  {t.form.loginDesc}
                </p>
                <div className="flex justify-center gap-4">
                  <Link to="/login?redirect=/custom-design" className="bg-aria-charcoal text-white dark:bg-white dark:text-black px-8 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors">
                    {t.form.loginBtn}
                  </Link>
                  <Link to="/register" className="border border-aria-charcoal dark:border-white px-8 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    {t.form.registerBtn}
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">

                {/* 1. Informasi Proyek */}
                <div className="mb-24">
                  <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight border-b-2 border-black dark:border-white pb-6 mb-10">{t.form.step1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">{t.form.projName}</label>
                      <input {...register('designTitle')} className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white" />
                      {errors.designTitle && <span className="text-xs text-red-500">{errors.designTitle.message}</span>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">{t.form.purpose}</label>
                      <select {...register('purpose')} className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white appearance-none">
                        <option value="">---</option>
                        <option value="Event/Acara">Event / Kepanitiaan</option>
                        <option value="Merchandise Brand">Merchandise Brand (Retail)</option>
                        <option value="Komunitas">Seragam Komunitas / Kantor</option>
                        <option value="Hadiah/Pribadi">Hadiah / Keperluan Pribadi</option>
                      </select>
                      {errors.purpose && <span className="text-xs text-red-500">{errors.purpose.message}</span>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">{t.form.deadline}</label>
                      <input type="date" {...register('deadline')} className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white" />
                      {errors.deadline && <span className="text-xs text-red-500">{errors.deadline.message}</span>}
                    </div>
                  </div>
                </div>

                {/* 2. Spesifikasi Produk */}
                <div className="mb-24">
                  <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight border-b-2 border-black dark:border-white pb-6 mb-10">{t.form.step2}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">{t.form.material}</label>
                      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                        {sablonCategories.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => { setActiveCategory(cat); setValue('productTypeForSablon', ''); setValue('colorPreferences', ''); }}
                            className={`px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors border ${activeCategory === cat ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'bg-transparent text-gray-500 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {isLoadingProducts ? (
                          <div className="col-span-full py-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div></div>
                        ) : customProducts.filter(p => {
                          const catId = p.categoryId || '';
                          if (activeCategory === 'Pakaian' && catId === 'cat-pakaian') return true;
                          if (activeCategory === 'Tas & Merchandise' && catId === 'cat-tas') return true;
                          if (activeCategory === 'Packaging' && catId === 'cat-packaging') return true;

                          const cat = categories.find(c => c.id === p.categoryId);
                          const catName = cat ? (cat.categoryName || cat.name || '') : '';
                          return catName === activeCategory ||
                            (activeCategory === 'Pakaian' && catName.toLowerCase().includes('pakaian')) ||
                            (activeCategory === 'Tas & Merchandise' && (catName.toLowerCase().includes('tas') || catName.toLowerCase().includes('merch'))) ||
                            (activeCategory === 'Packaging' && catName.toLowerCase().includes('packaging'));
                        }).map(product => {
                          const isSelected = watch('productTypeForSablon') === product.id;
                          return (
                            <div
                              key={product.id}
                              onClick={() => setValue('productTypeForSablon', product.id, { shouldValidate: true })}
                              className={`cursor-pointer border transition-all duration-300 relative overflow-hidden group flex flex-col ${isSelected ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-800 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'}`}
                            >
                              <div className="w-full aspect-square bg-white dark:bg-gray-800 p-2 overflow-hidden border-b border-gray-100 dark:border-gray-700">
                                <ProductImageCarousel product={product} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" />
                              </div>
                              <div className="p-4 text-center flex-1 flex flex-col justify-between">
                                <div className="space-y-1">
                                  <div className="font-bold text-sm leading-tight text-gray-900 dark:text-white">{product.productName}</div>
                                  <div className="text-[10px] leading-tight text-gray-500">{product.description || 'Custom Material'}</div>
                                  {product.price > 0 && <div className="text-xs font-bold text-green-600 dark:text-green-400 pt-1">+Rp {(product.price / 1000)}k</div>}
                                </div>
                                <div className="mt-3">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setSpecModalProduct(product); }}
                                    className="text-[10px] uppercase font-bold tracking-widest text-aria-charcoal border-b border-aria-charcoal dark:text-white dark:border-white hover:text-blue-500 hover:border-blue-500 transition-colors inline-block mx-auto"
                                  >
                                    Info Detail
                                  </button>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-black dark:bg-white border-2 border-white dark:border-black shadow-sm" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <input type="hidden" {...register('productTypeForSablon')} />
                      {errors.productTypeForSablon && <span className="text-xs text-red-500">{errors.productTypeForSablon.message}</span>}
                    </div>

                    {true && (
                      <div className="space-y-3 md:col-span-2 mt-4">
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                          {activeCategory === 'Pakaian' ? 'Tipe / Warna Kain *' : activeCategory === 'Tas & Merchandise' ? 'Tipe / Warna (Topi/Tas) *' : 'Tipe / Warna Kemasan *'}
                        </label>
                        <div className="flex flex-wrap gap-4">
                          {getAvailableColors(customProducts.find(p => p.id === watch('productTypeForSablon')), activeCategory).map(color => {
                            const isSelected = watch('colorPreferences') === color.name && !customColor;
                            const isOutOfStock = color.id !== undefined && color.stock <= 0;
                            
                            // Use Pill UI for Packaging
                            if (activeCategory === 'Packaging') {
                              return (
                                <button
                                  key={color.name}
                                  type="button"
                                  disabled={isOutOfStock}
                                  onClick={() => { setCustomColor(''); setValue('colorPreferences', color.name, { shouldValidate: true }); }}
                                  className={`px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all ${isSelected ? 'border-black bg-black text-white shadow-md dark:border-white dark:bg-white dark:text-black' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'} ${isOutOfStock ? 'opacity-30 cursor-not-allowed' : ''}`}
                                >
                                  {color.name.split(' (')[0]}
                                  {isOutOfStock && ' (Habis)'}
                                </button>
                              );
                            }

                            // Use Circle Swatch UI for other categories
                            return (
                              <div key={color.name} className="flex flex-col items-center space-y-1">
                                <button
                                  type="button"
                                  disabled={isOutOfStock}
                                  onClick={() => { setCustomColor(''); setValue('colorPreferences', color.name, { shouldValidate: true }); }}
                                  className={`w-8 h-8 rounded-full border-2 transition-all relative ${isSelected ? 'border-black dark:border-white scale-110 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:scale-105'} ${isOutOfStock ? 'opacity-30 cursor-not-allowed border-red-300' : ''}`}
                                  style={{ backgroundColor: color.hex }}
                                  title={`${color.name}${isOutOfStock ? ' (Habis)' : ''}`}
                                >
                                  {isOutOfStock && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-full h-0.5 bg-red-500 rotate-45 transform"></div>
                                    </div>
                                  )}
                                  {isSelected && !isOutOfStock && (
                                    <svg className="w-full h-full text-white mix-blend-difference p-1.5 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                  )}
                                </button>
                                <span className={`text-[9px] ${isOutOfStock ? 'text-red-400' : 'text-gray-500'} hidden sm:block truncate max-w-[60px] text-center`}>{color.name.split(' (')[0]}</span>
                              </div>
                            );
                          })}
                        </div>
                        <input type="hidden" {...register('colorPreferences')} />
                        {errors.colorPreferences && <span className="text-xs text-red-500">{errors.colorPreferences.message}</span>}
                      </div>
                    )}

                    <div className="space-y-4 md:col-span-2 bg-gray-50 dark:bg-gray-900/50 p-6 border border-gray-200 dark:border-gray-800 mt-4">
                      {activeCategory === 'Pakaian' ? (
                        <>
                          <div className="flex justify-between items-end mb-2">
                            <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">{t.form.sizes}</label>
                            <div className="text-right">
                              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Total Quantity</label>
                              <div className="text-2xl font-display font-bold">{watch('quantity') || 0} <span className="text-sm font-normal text-gray-500">Pcs</span></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {Object.keys(sizes).map((size) => (
                              <div key={size} className="flex flex-col">
                                <label className="text-[10px] font-bold text-center mb-1 bg-gray-200 dark:bg-gray-800 py-1">{size}</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={sizes[size]}
                                  onChange={(e) => handleSizeChange(size, e.target.value)}
                                  className="w-full border border-gray-300 dark:border-gray-700 p-2 text-center text-sm focus:outline-none focus:border-black dark:focus:border-white bg-white dark:bg-black"
                                />
                              </div>
                            ))}
                          </div>
                          {errors.quantity && <span className="text-xs text-red-500 block text-right mt-2">{errors.quantity.message}</span>}
                          {errors.sizeBreakdown && !errors.quantity && <span className="text-xs text-red-500 block text-right mt-2">{errors.sizeBreakdown.message}</span>}
                        </>
                      ) : (
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-widest text-gray-500 block mb-3">Total Quantity *</label>
                          <input
                            type="number"
                            min="1"
                            {...register('quantity', { valueAsNumber: true })}
                            className="w-full border border-gray-300 dark:border-gray-700 p-3 text-sm focus:outline-none focus:border-black dark:focus:border-white bg-white dark:bg-black max-w-md"
                            placeholder="Masukkan jumlah yang dibutuhkan"
                          />
                          {errors.quantity && <span className="text-xs text-red-500 block mt-2">{errors.quantity.message}</span>}
                        </div>
                      )}

                      {/* Hidden inputs to register with react-hook-form */}
                      {activeCategory === 'Pakaian' && <input type="hidden" {...register('quantity', { valueAsNumber: true })} />}
                      <input type="hidden" {...register('sizeBreakdown')} />
                    </div>
                  </div>
                </div>

                {/* 3. Teknis Sablon & Artwork */}
                <div className="mb-24">
                  <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight border-b-2 border-black dark:border-white pb-6 mb-10">{t.form.step3}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">{t.form.tech}</label>
                      <select {...register('printTechnique')} className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white appearance-none">
                        <option value="">-- Pilih Teknik Sablon --</option>
                        {(() => {
                          const activeCatObj = categories.find(c => c.categoryName.toLowerCase().includes(activeCategory.toLowerCase()));
                          const activeCatId = activeCatObj ? activeCatObj.id : null;

                          console.log('DEBUG SABLON:', { activeCategory, activeCatId, techniquesLength: printTechniques.length, categoriesLength: categories.length, printTechniques });

                          const availableTechniques = printTechniques.filter(t =>
                            !t.allowedCategories || t.allowedCategories.length === 0 ||
                            !activeCatId ||
                            t.allowedCategories.includes(activeCatId)
                          );

                          const qty = watch('quantity') || 1;

                          return availableTechniques.map(tech => (
                            <option key={tech.id} value={tech.name} disabled={qty < tech.minOrder}>
                              {tech.name} {qty < tech.minOrder ? `(Min. ${tech.minOrder} pcs)` : ''}
                            </option>
                          ));
                        })()}
                      </select>
                      <p className="text-[10px] text-gray-500 mt-1">*Pilih teknik sesuai jumlah pesanan Anda.</p>
                    </div>
                    {selectedTech?.pricingType === 'color_based' && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">{t.form.colors}</label>
                        <input type="number" {...register('numberOfColors', { valueAsNumber: true })} min="1" max={selectedTech.maxColors || undefined} className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white" />
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-[10px] text-gray-500">*Perkiraan saja. Tim kami akan mengecek ulang.</p>
                          {selectedTech.maxColors && <p className="text-[10px] text-amber-600 font-bold">Maks: {selectedTech.maxColors} warna</p>}
                        </div>
                        {errors.numberOfColors && <span className="text-xs text-red-500">{errors.numberOfColors.message}</span>}
                      </div>
                    )}
                    <div className="space-y-3 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">{t.form.pos}</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 border border-gray-300 dark:border-gray-700 p-4">
                        {t.form.posOptions.map((pos) => (
                          <label key={pos} className="flex items-center space-x-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={selectedPositions.includes(pos)}
                              onChange={() => handlePositionToggle(pos)}
                              className="w-4 h-4 text-aria-charcoal dark:text-white bg-gray-100 border-gray-300 focus:ring-black dark:focus:ring-white dark:bg-gray-800 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white">{pos}</span>
                          </label>
                        ))}
                      </div>
                      <input type="hidden" {...register('printPosition')} />
                      {errors.printPosition && <span className="text-xs text-red-500">{errors.printPosition.message}</span>}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">{t.form.upload}</label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 text-center">
                        <input type="file" onChange={handleFileChange} className="mx-auto block text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:bg-gray-100 file:text-black hover:file:bg-gray-200" accept=".png,.jpg,.jpeg,.pdf,.ai,.cdr,.zip" />
                        <p className="text-xs text-gray-500 mt-2">{t.form.uploadDesc}</p>
                        {fileError && <p className="text-xs text-red-500 mt-2">{fileError}</p>}
                      </div>

                      {/* Arianation Studio MVP (Canvas) */}
                      <div className="mt-6 border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
                        <div className="flex justify-between items-center mb-3 border-b border-gray-200 dark:border-gray-800 pb-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-aria-charcoal dark:text-white">Arianation Studio Lite</h4>
                          <span className="text-[10px] text-gray-500 uppercase">Interactive Preview</span>
                        </div>

                        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
                          {(() => {
                            const productData = customProducts.find(p => p.id === watch('productTypeForSablon'));
                            const sidesSet = new Set();
                            if (productData && productData.variants && productData.variants.length > 0) {
                              productData.variants.forEach(v => {
                                if (v.imageUrl) sidesSet.add('Depan');
                                if (v.imageUrlBack) sidesSet.add('Belakang');
                                if (v.imageUrlLeft) sidesSet.add('Kiri');
                                if (v.imageUrlRight) sidesSet.add('Kanan');
                              });
                            }
                            if (sidesSet.size === 0) sidesSet.add('Depan'); // Minimum fallback
                            const order = ['Depan', 'Belakang', 'Kiri', 'Kanan'];
                            const availableSides = order.filter(s => sidesSet.has(s));

                            return availableSides.map(side => (
                              <button
                                key={side}
                                type="button"
                                onClick={() => setActiveSide(side)}
                                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors border ${activeSide === side ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'bg-transparent text-gray-500 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                              >
                                {side} {designs[side].previewUrl && '✓'}
                              </button>
                            ));
                          })()}
                        </div>

                        <div className="text-[10px] text-gray-500 mb-4">
                          Upload desain untuk sisi <strong>{activeSide}</strong>. Tarik ujung gambar untuk *resize*, klik dan seret untuk memindahkan.
                        </div>

                        {!designs[activeSide].previewUrl ? (
                          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 text-center bg-white dark:bg-black mb-4">
                            <input type="file" onChange={(e) => handleFileChange(e, activeSide)} className="mx-auto block text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:bg-gray-100 file:text-black hover:file:bg-gray-200" accept=".png,.jpg,.jpeg,.pdf,.ai,.cdr,.zip" />
                            <p className="text-[10px] text-gray-500 mt-2">Upload desain {activeSide} di sini</p>
                          </div>
                        ) : (
                          <div className="mb-4 text-center">
                            <button type="button" onClick={() => setDesigns(prev => ({ ...prev, [activeSide]: { ...prev[activeSide], file: null, previewUrl: null } }))} className="text-[10px] text-red-500 hover:text-red-700 uppercase font-bold tracking-widest border border-red-500 px-3 py-1">
                              Hapus Desain {activeSide}
                            </button>
                          </div>
                        )}

                        <div className="flex justify-center">
                          <div
                            ref={mockupRef}
                            className="relative w-full max-w-[400px] aspect-[3/4] bg-white border border-gray-200 shadow-sm overflow-hidden"
                          >
                            {/* BACKGROUND MOCKUP (Real Image or Fallback SVG) */}
                            {getMockupImage(customProducts.find(p => p.id === watch('productTypeForSablon')), watch('colorPreferences'), activeSide) ? (
                              <div
                                className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                                style={{
                                  backgroundImage: `url('${getMockupImage(customProducts.find(p => p.id === watch('productTypeForSablon')), watch('colorPreferences'), activeSide)}')`
                                }}
                              />
                            ) : (
                              <>
                                {/* REALISTIC FALLBACK (Photo + Multiply Color Overlay) */}
                                <div
                                  className="absolute inset-0 bg-cover bg-center"
                                  style={{
                                    backgroundImage: `url('https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop')`,
                                  }}
                                />
                                <div
                                  className="absolute inset-0"
                                  style={{
                                    backgroundColor: customColor || getAvailableColors(customProducts.find(p => p.id === watch('productTypeForSablon')), activeCategory).find(c => c.name === watch('colorPreferences'))?.hex || '#ffffff',
                                    mixBlendMode: 'multiply',
                                    opacity: 0.9
                                  }}
                                />
                              </>
                            )}

                            {/* LAPIS 3: Area Desain / Drag & Drop */}
                            {designs[activeSide].previewUrl && (
                              <Rnd
                                size={{ width: designs[activeSide].rnd.width, height: designs[activeSide].rnd.height }}
                                position={{ x: designs[activeSide].rnd.x, y: designs[activeSide].rnd.y }}
                                onDragStop={(e, d) => setDesigns(prev => ({ ...prev, [activeSide]: { ...prev[activeSide], rnd: { ...prev[activeSide].rnd, x: d.x, y: d.y } } }))}
                                onResizeStop={(e, direction, ref, delta, position) => {
                                  setDesigns(prev => ({
                                    ...prev,
                                    [activeSide]: {
                                      ...prev[activeSide],
                                      rnd: {
                                        width: ref.style.width,
                                        height: ref.style.height,
                                        ...position,
                                      }
                                    }
                                  }));
                                }}
                                lockAspectRatio={true}
                                className="border-2 border-dashed border-blue-500 group"
                                dragHandleClassName="drag-handle"
                              >
                                <div className="w-full h-full drag-handle cursor-move relative">
                                  <img
                                    src={designs[activeSide].previewUrl}
                                    alt={`Design Preview ${activeSide}`}
                                    draggable={false}
                                    className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                                  />
                                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[8px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {activeSide}
                                  </div>
                                </div>
                              </Rnd>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">{t.form.notes}</label>
                      <textarea {...register('designDescription')} rows={3} className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white"></textarea>
                    </div>
                  </div>
                </div>

                {/* 4. Kontak & Pengiriman */}
                <div className="mb-24">
                  <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight border-b-2 border-black dark:border-white pb-6 mb-10">{t.form.step4}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">{t.form.pic}</label>
                      <input {...register('picName')} className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white" />
                      {errors.picName && <span className="text-xs text-red-500">{errors.picName.message}</span>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">{t.form.wa}</label>
                      <input {...register('whatsappNumber')} className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white" />
                      {errors.whatsappNumber && <span className="text-xs text-red-500">{errors.whatsappNumber.message}</span>}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">{t.form.address}</label>
                      <textarea {...register('shippingAddress')} rows={3} className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white"></textarea>
                      {errors.shippingAddress && <span className="text-xs text-red-500">{errors.shippingAddress.message}</span>}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">{t.form.shipNotes}</label>
                      <input {...register('shippingNotes')} className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white" />
                    </div>
                  </div>
                </div>

                {submitError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
                  </div>
                )}

                <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 mb-6 flex gap-3 text-left">
                    <div className="text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-1">{t.form.disclaimerTitle}</h4>
                      <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">{t.form.disclaimer}</p>
                    </div>
                  </div>

                  {/* Dynamic Pricing Estimator */}
                  {(() => {
                    const selectedProduct = customProducts.find(p => p.id === watch('productTypeForSablon'));
                    const basePrice = selectedProduct?.price || 0;

                    let techPrice = 0;
                    const colors = parseInt(watch('numberOfColors')) || 1;
                    const qty = parseInt(watch('quantity')) || 0;

                    // Dynamic technique pricing
                    if (selectedTech) {
                      const baseTechPrice = parseFloat(selectedTech.basePrice) || 0;

                      if (selectedTech.pricingType === 'fixed') {
                        techPrice = baseTechPrice;
                      } else if (selectedTech.pricingType === 'color_based') {
                        techPrice = baseTechPrice * colors;
                      } else if (selectedTech.pricingType === 'area_based') {
                        const positionMultiplier = {
                          'Dada Kiri (Logo)': 1.0,
                          'Dada Kanan (Logo)': 1.0,
                          'Dada Tengah (Medium)': 1.5,
                          'Full Depan (A4/A3)': 2.0,
                          'Punggung Belakang (A4/A3)': 2.0,
                          'Lengan Kiri': 1.0,
                          'Lengan Kanan': 1.0,
                          'Tengkuk Leher (Neck label)': 1.0
                        };

                        let totalMultiplier = 0;
                        selectedPositions.forEach(pos => {
                          totalMultiplier += (positionMultiplier[pos] || 1.0);
                        });

                        if (totalMultiplier === 0) totalMultiplier = 1.0;
                        techPrice = baseTechPrice * totalMultiplier;
                      }
                    }

                    const estimatedUnit = basePrice + techPrice;
                    const estimatedTotal = estimatedUnit * qty;

                    if (qty > 0) {
                      return (
                        <div className="bg-black text-white dark:bg-white dark:text-black p-6 mb-6 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left border border-black dark:border-white sticky bottom-0 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_-10px_40px_rgba(255,255,255,0.1)]">
                          <div className="flex-1 w-full">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Estimasi Total Harga</h4>
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-2">
                              <div className="text-3xl font-display font-medium text-white dark:text-black">Rp {estimatedTotal.toLocaleString('id-ID')}</div>
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                (Rp {estimatedUnit.toLocaleString('id-ID')} / pcs)
                              </div>
                            </div>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider flex flex-wrap gap-x-4 gap-y-1">
                              <span>Produk: Rp {basePrice.toLocaleString('id-ID')}</span>
                              <span>Sablon: Rp {techPrice.toLocaleString('id-ID')}</span>
                            </div>
                          </div>
                          <div className="mt-4 sm:mt-0 text-[10px] text-gray-400 dark:text-gray-500 max-w-xs sm:text-right">
                            *Harga ini adalah estimasi sistem berdasarkan input Anda. Harga final akan disesuaikan kembali saat proses konfirmasi desain & review oleh tim kami.
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <button type="submit" disabled={!file || submitError || fileError} className="w-full bg-aria-charcoal text-white dark:bg-white dark:text-black py-5 text-sm font-bold uppercase tracking-[0.2em] hover:bg-black transition-colors disabled:opacity-50">
                    {t.form.submit}
                  </button>
                  <p className="text-center text-xs text-gray-500 mt-4">
                    {t.form.terms}
                  </p>
                </div>

              </form>
            )}

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-display font-medium uppercase tracking-widest mb-4">FAQ & Panduan Order</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Pertanyaan yang sering ditanyakan seputar custom order</p>
          </div>
          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full text-left px-6 py-4 flex justify-between items-center focus:outline-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <span className="text-sm font-semibold uppercase tracking-widest pr-4">{faq.question || faq.q}</span>
                  <svg className={`w-5 h-5 transition-transform duration-300 flex-shrink-0 ${openFaq === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-96 border-t border-gray-200 dark:border-gray-800 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-6 text-sm text-gray-600 dark:text-gray-400">
                    {faq.answer || faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Specification Modal */}
      {specModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-black w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 relative">
            <button
              type="button"
              onClick={() => setSpecModalProduct(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black dark:hover:text-white"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div
                className="bg-gray-100 dark:bg-gray-900 h-64 md:h-auto relative overflow-hidden flex items-center justify-center"
              >
                <ProductImageCarousel product={specModalProduct} className="w-full h-full object-cover" />
              </div>
              <div className="p-8 space-y-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{specModalProduct.category}</div>
                <h3 className="text-2xl font-display font-bold uppercase tracking-tight mb-4">{specModalProduct.name}</h3>
                <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400 mb-8">
                  <p><strong>Spesifikasi:</strong> {specModalProduct.desc}</p>
                  <p>Ini adalah spesifikasi dummy. Nanti admin bisa mengisi detail lengkap seperti ketebalan gramasi, jenis jahitan rantai, atau fitur khusus untuk produk ini.</p>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest mb-3">Size Chart</h4>
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        <th className="py-2">Size</th>
                        <th className="py-2">Lebar</th>
                        <th className="py-2">Panjang</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100 dark:border-gray-900">
                        <td className="py-2">S</td><td className="py-2">48 cm</td><td className="py-2">68 cm</td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-900">
                        <td className="py-2">M</td><td className="py-2">50 cm</td><td className="py-2">70 cm</td>
                      </tr>
                      <tr>
                        <td className="py-2">L</td><td className="py-2">52 cm</td><td className="py-2">72 cm</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setValue('productTypeForSablon', specModalProduct.id, { shouldValidate: true });
                    setSpecModalProduct(null);
                  }}
                  className="mt-8 w-full bg-aria-charcoal text-white dark:bg-white dark:text-black py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-black transition-colors"
                >
                  Pilih Produk Ini
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

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
import { useTranslation, Trans } from 'react-i18next';
import SizeChartModal from '../components/SizeChartModal';
import { toast } from 'react-toastify';
import SablonCartDrawer from '../components/SablonCartDrawer';
import { ShoppingBag } from 'lucide-react';
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



// Variants for framer motion
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

export default function DesignRequest() {
  const navigate = useNavigate();
  const { t: rootT, i18n } = useTranslation('translation');
  const t = rootT('designRequest', { returnObjects: true });
  const { user, isAuthenticated } = useAuthStore();
  const setNavbarTheme = useUIStore(state => state.setNavbarTheme);
  const { categories, fetchCategories } = useCategoryStore();
  const { techniques: printTechniques, fetchTechniquesPublic } = usePrintTechniqueStore();

  const [portfolioItems, setPortfolioItems] = useState([]);
  const [showSizeModal, setShowSizeModal] = useState(false);

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
  const [customProducts, setCustomProducts] = useState([]);
  const [faqItems, setFaqItems] = useState(FAQ_ITEMS);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [storeSettings, setStoreSettings] = useState({});

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
        const [faqRes, settingsRes] = await Promise.all([
          api.get('/design-info/faqs').catch(() => ({ data: {} })),
          api.get('/settings').catch(() => ({ data: { data: {} } }))
        ]);

        if (faqRes.data?.success && faqRes.data.data.length > 0) setFaqItems(faqRes.data.data);
        if (settingsRes.data?.data) setStoreSettings(settingsRes.data.data);

      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchData();
  }, [fetchCategories, fetchCustomProducts, fetchTechniquesPublic]);

  const [designMethod, setDesignMethod] = useState('canvas'); // 'canvas' | 'upload'
  const [mockupFile, setMockupFile] = useState(null);
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
    const defaultOrder = ['Pakaian', 'Packaging', 'Tas & Merchandise'];
    if (!customProducts.length || !categories.length) return defaultOrder;
    
    const usedCategoryIds = [...new Set(customProducts.map(p => p.categoryId))];
    const catNames = usedCategoryIds.map(id => categories.find(c => c.id === id)?.categoryName).filter(Boolean);
    if (catNames.length === 0) return defaultOrder;
    
    // Sort based on the strict defaultOrder index to prevent UI swapping left/right
    return [...new Set(catNames)].sort((a, b) => {
      const indexA = defaultOrder.indexOf(a);
      const indexB = defaultOrder.indexOf(b);
      // If both are in defaultOrder, sort by their position
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      // If only one is in defaultOrder, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      // Otherwise fallback to alphabetical for any new dynamic categories
      return a.localeCompare(b);
    });
  }, [customProducts, categories]);

  const [activeCategory, setActiveCategory] = useState('Pakaian');
  const [specModalProduct, setSpecModalProduct] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartDraftCount, setCartDraftCount] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch initial draft count when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      api.get('/orders/custom-sablon/draft')
        .then(res => setCartDraftCount(res.data.data?.length || 0))
        .catch(() => {});
    }
  }, [isAuthenticated]);



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
    sizeBreakdown: z.string().optional(),
    colorPreferences: z.string().min(2, t.form.errors.color),
    printPosition: z.string().optional(),
    printSize: z.string().optional(),
    printTechnique: z.string().min(1, t.form.errors.tech),
    numberOfColors: z.coerce.number().optional(),
    picName: z.string().min(2, t.form.errors.pic),
    whatsappNumber: z.string().min(9, t.form.errors.wa),
    shippingAddress: z.string().min(10, t.form.errors.address),
    shippingNotes: z.string().optional(),
    designDescription: z.string().optional(),
  }).superRefine((data, ctx) => {
    // SOP 1: Pakaian requires sizes, printSize, and printPosition
    if (activeCategory === 'Pakaian') {
      if (!data.sizeBreakdown || data.sizeBreakdown.trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t.form.errors.sizes || "Rincian ukuran wajib diisi (misal: S:3, M:5)", path: ['sizeBreakdown'] });
      }
      if (!data.printSize || data.printSize.trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: i18n.language === 'EN' ? 'Print size is required' : 'Ukuran sablon wajib dipilih', path: ['printSize'] });
      }
      if (!data.printPosition || data.printPosition.trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t.form.errors.pos || "Posisi sablon wajib dipilih", path: ['printPosition'] });
      }
    } 
    // SOP 2: Tas & Merchandise requires printPosition
    else if (activeCategory === 'Tas & Merchandise') {
      if (!data.printPosition || data.printPosition.trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t.form.errors.pos || "Posisi sablon wajib dipilih", path: ['printPosition'] });
      }
    }
    // SOP 3: Packaging has no required printSize/printPosition (hardcoded on submit)

    const isManual = data.printTechnique === 'Plastisol' || data.printTechnique === 'Rubber';
    if (isManual && data.quantity < 12) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t.form.errors.qtyManual,
        path: ['quantity']
      });
    }

    const selectedT = printTechniques.find(t => t.name === data.printTechnique);
    if (selectedT && selectedT.maxColors) {
      if (data.numberOfColors > selectedT.maxColors) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Maksimal ${selectedT.maxColors} warna untuk teknik ini.`,
          path: ['numberOfColors']
        });
      }
    }
  }), [t, i18n, printTechniques, activeCategory]);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm({
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
    if (selectedTech?.pricingType === 'area_based' || selectedTech?.pricingType === 'fixed') {
      setValue('numberOfColors', 1);
    }
  }, [selectedTech, setValue]);

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
        setFileError(i18n.language === 'EN' ? 'Unsupported format. Please upload PNG/JPG/PDF/AI/CDR/ZIP.' : 'Format file tidak didukung. Harap unggah PNG/JPG/PDF/AI/CDR/ZIP.');
        return;
      }

      if (selectedFile.size > 50 * 1024 * 1024) {
        setFileError(i18n.language === 'EN' ? 'File size exceeds 50MB limit' : 'Ukuran file melebihi batas 50MB');
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
    
    // --- ENFORCE DEFAULT SOP VALUES FOR NON-APPAREL CATEGORIES ---
    if (activeCategory === 'Packaging') {
      data.printSize = 'Proporsional';
      data.printPosition = 'Tengah (Center Aligned)';
      data.sizeBreakdown = `All Size: ${data.quantity}`;
    } else if (activeCategory === 'Tas & Merchandise') {
      data.printSize = 'Proporsional';
      data.sizeBreakdown = `All Size: ${data.quantity}`;
    }

    if (!file && !Object.values(designs).some(d => d.file)) {
      setFileError(i18n.language === 'EN' ? 'Design file is required' : 'File desain wajib diunggah');
      return;
    }

    try {
      setSubmitLoading(true);
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

      if (designMethod === 'upload') {
        if (mockupFile) formData.append('mockupPreview', mockupFile);
      } else {
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
      }

      await api.post('/orders/custom-sablon/draft', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(i18n.language === 'EN' ? 'Design added to cart!' : 'Desain berhasil masuk keranjang!');
      setCartDraftCount(prev => prev + 1);
      
      // Magic UX: Reset only specific states, keep canvas intact
      setSizes({ S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 });
      setValue('quantity', 0);
      setMockupFile(null);
      setFile(null);
      setValue('colorPreferences', '');
      setIsCartOpen(true);
      
    } catch (err) {
      setSubmitError(err.response?.data?.message || (i18n.language === 'EN' ? 'Failed to submit design request' : 'Gagal mengirim permintaan desain'));
    } finally {
      setSubmitLoading(false);
    }
  };

  const getMinDateStr = () => {
    const qty = watch('quantity') || 1;
    const date = new Date();
    
    const t1Max = parseInt(storeSettings.sablon_tier1_max_qty) || 11;
    const t2Max = parseInt(storeSettings.sablon_tier2_max_qty) || 100;
    
    const t1Days = parseInt(storeSettings.sablon_tier1_min_days) || 7;
    const t2Days = parseInt(storeSettings.sablon_tier2_min_days) || 14;
    const t3Days = parseInt(storeSettings.sablon_tier3_min_days) || 30;

    if (qty <= t1Max) {
      date.setDate(date.getDate() + t1Days);
    } else if (qty <= t2Max) {
      date.setDate(date.getDate() + t2Days);
    } else {
      date.setDate(date.getDate() + t3Days);
    }
    return date.toISOString().split('T')[0];
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
        <PushNotificationBanner context="design" />
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
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {!isAuthenticated ? (
            <div className="max-w-4xl mx-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-8 md:p-12 shadow-sm">
              <h2 className="text-2xl font-display font-medium uppercase tracking-widest mb-2 text-center">{t.form.title}</h2>
              <p className="text-xs text-gray-500 uppercase tracking-widest text-center mb-12">{t.form.desc}</p>
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
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="lg:grid lg:grid-cols-3 lg:gap-12 relative items-start" noValidate>
              <div className="lg:col-span-2 space-y-12 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-8 md:p-12 shadow-sm">
                <h2 className="text-2xl font-display font-medium uppercase tracking-widest mb-2 text-center">{t.form.title}</h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest text-center mb-12">{t.form.desc}</p>

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
                      <input type="text" {...register('purpose')} placeholder="Misal: Event Konser, Merchandise Brand, dll" className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white" />
                      {errors.purpose && <span className="text-xs text-red-500">{errors.purpose.message}</span>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">{t.form.deadline}</label>
                      <input type="date" min={getMinDateStr()} {...register('deadline')} className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white" />
                      {errors.deadline && <span className="text-xs text-red-500">{errors.deadline.message}</span>}
                      <p className="text-[10px] text-gray-500 mt-1">*Batas minimum disesuaikan otomatis dengan jumlah (qty).</p>
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
                          <div className="flex justify-between items-end mb-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">{t.form.sizes}</label>
                                {customProducts.find(p => p.id === watch('productTypeForSablon'))?.sizeChartImage && (
                                  <button type="button" onClick={() => setShowSizeModal(true)} className="bg-aria-charcoal text-white dark:bg-white dark:text-black px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 w-max hover:bg-black transition-colors rounded-md shadow-sm border border-black/10">
                                    <span className="text-base">📏</span> LIHAT PANDUAN UKURAN (SIZE CHART)
                                  </button>
                                )}
                            </div>
                            <div className="text-right">
                              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Total Quantity</label>
                              <div className="text-2xl font-display font-bold">{watch('quantity') || 0} <span className="text-sm font-normal text-gray-500">Pcs</span></div>
                            </div>
                          </div>

                          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0">
                            {Object.keys(sizes).map((size) => (
                              <div key={size} className="flex flex-col min-w-[80px] lg:min-w-0">
                                <label className="text-[10px] font-bold text-center mb-1 bg-gray-200 dark:bg-gray-800 py-1">{size}</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={sizes[size]}
                                  onChange={(e) => handleSizeChange(size, e.target.value)}
                                  className="w-full border-2 border-gray-300 dark:border-gray-700 p-2 text-center text-sm focus:outline-none focus:border-black dark:focus:border-white bg-white dark:bg-black transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
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
                        <div className="flex flex-wrap gap-3">
                          {Array.from({ length: selectedTech.maxColors || 5 }, (_, i) => i + 1).map(num => (
                            <label key={num} className="cursor-pointer">
                              <input 
                                type="radio" 
                                value={num} 
                                {...register('numberOfColors', { valueAsNumber: true })} 
                                className="peer sr-only" 
                              />
                              <div className="w-12 h-12 flex items-center justify-center border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-sm font-bold transition-all peer-checked:border-black peer-checked:bg-black peer-checked:text-white dark:peer-checked:border-white dark:peer-checked:bg-white dark:peer-checked:text-black hover:border-gray-400 dark:hover:border-gray-500">
                                {num}
                              </div>
                            </label>
                          ))}
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-[10px] text-gray-500 leading-relaxed max-w-[80%]">
                            *Ini <strong>BUKAN</strong> jumlah kaos. Ini adalah <strong>jumlah variasi warna tinta</strong> pada desain Anda.<br/>(Misal: Tulisan putih saja = 1 warna. Logo merah & putih = 2 warna).
                          </p>
                          {selectedTech.maxColors && <p className="text-[10px] text-amber-600 font-bold">Maks: {selectedTech.maxColors} warna</p>}
                        </div>
                        {errors.numberOfColors && <span className="text-xs text-red-500 block mt-1">{errors.numberOfColors.message}</span>}
                      </div>
                    )}
                    {activeCategory !== 'Packaging' && (
                      <div className="space-y-3 md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">{t.form.pos}</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 border border-gray-300 dark:border-gray-700 p-4">
                          {(() => {
                            const posOptions = activeCategory === 'Pakaian' 
                              ? ['Dada Kiri (Logo)', 'Dada Kanan (Logo)', 'Dada Tengah (Medium)', 'Full Depan (A4/A3)', 'Punggung Belakang (A4/A3)', 'Lengan Kiri', 'Lengan Kanan', 'Tengkuk Leher (Neck label)']
                              : ['Tengah Depan', 'Tengah Belakang'];
                              
                            return posOptions.map((pos) => (
                              <label key={pos} className="flex items-center space-x-3 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={selectedPositions.includes(pos)}
                                  onChange={() => handlePositionToggle(pos)}
                                  className="w-4 h-4 text-aria-charcoal dark:text-white bg-gray-100 border-gray-300 focus:ring-black dark:focus:ring-white dark:bg-gray-800 dark:border-gray-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white">{pos}</span>
                              </label>
                            ));
                          })()}
                        </div>
                        <input type="hidden" {...register('printPosition')} />
                        {errors.printPosition && <span className="text-xs text-red-500">{errors.printPosition.message}</span>}
                      </div>
                    )}

                    {activeCategory === 'Pakaian' && (
                      <div className="space-y-3 md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Ukuran Sablon *</label>
                        <select {...register('printSize')} className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white appearance-none">
                          <option value="">-- Pilih Ukuran Sablon --</option>
                          {(() => {
                            if (selectedTech && selectedTech.pricingType === 'area_based' && selectedTech.priceMatrix) {
                              const matrix = typeof selectedTech.priceMatrix === 'string' ? JSON.parse(selectedTech.priceMatrix) : selectedTech.priceMatrix;
                              return Object.keys(matrix).map(sizeKey => (
                                <option key={sizeKey} value={sizeKey}>{sizeKey}</option>
                              ));
                            }
                            // Fallback
                            return (
                              <>
                                <option value="Logo/Kecil (Maks 10x10cm)">Logo/Kecil (Maks 10x10cm)</option>
                                <option value="A4 / Sedang (Maks 21x30cm)">A4 / Sedang (Maks 21x30cm)</option>
                                <option value="A3 / Besar (Maks 30x42cm)">A3 / Besar (Maks 30x42cm)</option>
                                <option value="Full / Custom">Full / Custom</option>
                              </>
                            );
                          })()}
                        </select>
                        {errors.printSize && <span className="text-xs text-red-500">{errors.printSize.message}</span>}
                      </div>
                    )}

                    <div className="space-y-4 md:col-span-2 mt-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">{t.form.upload}</label>
                        <div className="flex items-center gap-6 bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                          <label className="flex items-center gap-2 cursor-pointer px-4 py-1.5 rounded-full transition-all" style={designMethod === 'canvas' ? { backgroundColor: 'white', color: 'black', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: 'gray' }}>
                            <input 
                              type="radio" 
                              name="designMethod" 
                              value="canvas" 
                              checked={designMethod === 'canvas'} 
                              onChange={() => setDesignMethod('canvas')}
                              className="hidden"
                            />
                            <span className="text-xs font-bold uppercase tracking-widest">Gunakan Canvas</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer px-4 py-1.5 rounded-full transition-all" style={designMethod === 'upload' ? { backgroundColor: 'white', color: 'black', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: 'gray' }}>
                            <input 
                              type="radio" 
                              name="designMethod" 
                              value="upload" 
                              checked={designMethod === 'upload'} 
                              onChange={() => setDesignMethod('upload')}
                              className="hidden"
                            />
                            <span className="text-xs font-bold uppercase tracking-widest">Punya Mockup Sendiri</span>
                          </label>
                        </div>
                      </div>

                      {fileError && <p className="text-xs text-red-500 text-center font-bold">{fileError}</p>}

                      {designMethod === 'upload' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 text-center bg-white dark:bg-black transition-colors hover:border-black dark:hover:border-white">
                            <h4 className="text-xs font-bold uppercase tracking-widest mb-4">1. Upload Mockup Anda</h4>
                            <input 
                              type="file" 
                              onChange={(e) => setMockupFile(e.target.files[0])} 
                              className="mx-auto block text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:bg-gray-100 file:text-black hover:file:bg-gray-200" 
                              accept=".png,.jpg,.jpeg" 
                            />
                            {mockupFile && <p className="text-xs text-green-600 mt-2 font-semibold">Mockup: {mockupFile.name}</p>}
                          </div>
                          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 text-center bg-white dark:bg-black transition-colors hover:border-black dark:hover:border-white">
                            <h4 className="text-xs font-bold uppercase tracking-widest mb-2">2. Upload File Master Desain</h4>
                            <input 
                              type="file" 
                              onChange={handleFileChange} 
                              className="mx-auto block text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:bg-gray-100 file:text-black hover:file:bg-gray-200" 
                              accept=".png,.jpg,.jpeg,.pdf,.ai,.cdr,.zip" 
                            />
                            <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest">Format: PNG, JPG, PDF, AI, CDR, ZIP (Maks 20MB)</p>
                            {file && <p className="text-xs text-green-600 mt-2 font-semibold">File Desain: {file.name}</p>}
                          </div>
                        </div>
                      ) : (
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
                      )}
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
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-center lg:hidden">
                    <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
                  </div>
                )}

                <div className="pt-8 border-t border-gray-200 dark:border-gray-800 lg:hidden">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 mb-6 flex gap-3 text-left">
                    <div className="text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-1">{t.form.disclaimerTitle}</h4>
                      <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">{t.form.disclaimer}</p>
                    </div>
                  </div>

                  {/* Dynamic Pricing Estimator - Mobile */}
                  {(() => {
                    const selectedProduct = customProducts.find(p => p.id === watch('productTypeForSablon'));
                    const basePrice = selectedProduct?.price || 0;

                    let techPrice = 0;
                    const colors = parseInt(watch('numberOfColors')) || 1;
                    const qty = parseInt(watch('quantity')) || 0;
                    const printPos = watch('printPosition') || '';
                    const numSides = printPos ? printPos.split(',').filter(Boolean).length : 0;
                    const multiplierSisi = numSides > 0 ? numSides : 1;

                    // Dynamic technique pricing
                    if (selectedTech) {
                      const baseTechPrice = parseFloat(selectedTech.basePrice) || 0;

                      if (selectedTech.pricingType === 'fixed') {
                        techPrice = baseTechPrice;
                      } else if (selectedTech.pricingType === 'color_based') {
                        techPrice = baseTechPrice * colors * multiplierSisi;
                      } else if (selectedTech.pricingType === 'area_based') {
                        const matrix = selectedTech.priceMatrix ? (typeof selectedTech.priceMatrix === 'string' ? JSON.parse(selectedTech.priceMatrix) : selectedTech.priceMatrix) : null;
                        const currentSize = watch('printSize');
                        if (matrix && currentSize && matrix[currentSize] !== undefined) {
                          techPrice = parseFloat(matrix[currentSize]) * multiplierSisi;
                        } else {
                          techPrice = baseTechPrice * multiplierSisi;
                        }
                      }
                    }

                    const estimatedUnit = basePrice + techPrice;
                    const estimatedTotal = estimatedUnit * qty;

                    let sablonLabel = "Sablon";
                    if (selectedTech) {
                      const techName = selectedTech.name.split(' (')[0];
                      if (selectedTech.pricingType === 'color_based') {
                        sablonLabel = `Sablon (${techName} - ${colors} Warna)`;
                      } else if (selectedTech.pricingType === 'area_based') {
                        const size = watch('printSize');
                        sablonLabel = `Sablon (${techName}${size ? ` - ${size.split(' /')[0]}` : ''})`;
                      } else {
                        sablonLabel = `Sablon (${techName})`;
                      }
                    }

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
                              <span>{sablonLabel}: Rp {techPrice.toLocaleString('id-ID')}</span>
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
                  <button
                      type="submit"
                      disabled={isSubmitting || isLoadingProducts}
                      className="w-full flex items-center justify-center gap-2 bg-aria-charcoal text-white dark:bg-white dark:text-black py-5 text-sm font-bold uppercase tracking-[0.2em] hover:bg-black dark:hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      {isSubmitting ? (i18n.language === 'EN' ? 'Adding to Cart...' : 'Menambahkan ke Keranjang...') : (i18n.language === 'EN' ? 'Add to Sablon Cart' : 'Tambah ke Keranjang Sablon')}
                    </button>
                  <p className="text-center text-xs text-gray-500 mt-4 lg:hidden">
                    {t.form.terms}
                  </p>
                </div>
              </div>

              {/* Right Column: Sticky Order Summary Desktop */}
              <div className="hidden lg:block lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest border-b border-gray-200 dark:border-gray-800 pb-4 mb-4">Ringkasan Pesanan</h3>
                  
                  {submitError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 mb-4 text-center">
                      <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
                    </div>
                  )}

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 mb-6 flex gap-3 text-left">
                    <div className="text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-1">{t.form.disclaimerTitle}</h4>
                      <p className="text-[10px] text-amber-700 dark:text-amber-500 leading-relaxed">{t.form.disclaimer}</p>
                    </div>
                  </div>

                  {/* Dynamic Pricing Estimator Desktop */}
                  {(() => {
                    const selectedProduct = customProducts.find(p => p.id === watch('productTypeForSablon'));
                    const basePrice = selectedProduct?.price || 0;

                    let techPrice = 0;
                    const colors = parseInt(watch('numberOfColors')) || 1;
                    const qty = parseInt(watch('quantity')) || 0;

                    const printPos = watch('printPosition') || '';
                    const numSides = printPos ? printPos.split(',').filter(Boolean).length : 0;
                    const multiplierSisi = numSides > 0 ? numSides : 1;

                    if (selectedTech) {
                      const baseTechPrice = parseFloat(selectedTech.basePrice) || 0;

                      if (selectedTech.pricingType === 'fixed') {
                        techPrice = baseTechPrice;
                      } else if (selectedTech.pricingType === 'color_based') {
                        techPrice = baseTechPrice * colors * multiplierSisi;
                      } else if (selectedTech.pricingType === 'area_based') {
                        const matrix = selectedTech.priceMatrix ? (typeof selectedTech.priceMatrix === 'string' ? JSON.parse(selectedTech.priceMatrix) : selectedTech.priceMatrix) : null;
                        const currentSize = watch('printSize');
                        if (matrix && currentSize && matrix[currentSize] !== undefined) {
                          techPrice = parseFloat(matrix[currentSize]) * multiplierSisi;
                        } else {
                          techPrice = baseTechPrice * multiplierSisi;
                        }
                      }
                    }

                    const estimatedUnit = basePrice + techPrice;
                    const estimatedTotal = estimatedUnit * qty;

                    let sablonLabel = "Sablon";
                    if (selectedTech) {
                      const techName = selectedTech.name.split(' (')[0];
                      if (selectedTech.pricingType === 'color_based') {
                        sablonLabel = `Sablon (${techName} - ${colors} Warna)`;
                      } else if (selectedTech.pricingType === 'area_based') {
                        const size = watch('printSize');
                        sablonLabel = `Sablon (${techName}${size ? ` - ${size.split(' /')[0]}` : ''})`;
                      } else {
                        sablonLabel = `Sablon (${techName})`;
                      }
                    }

                    if (qty > 0) {
                      return (
                        <div className="bg-black text-white dark:bg-white dark:text-black p-5 mb-6 text-center border border-black dark:border-white">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Estimasi Total Harga</h4>
                          <div className="text-3xl font-display font-medium text-white dark:text-black mb-1">Rp {estimatedTotal.toLocaleString('id-ID')}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                            (Rp {estimatedUnit.toLocaleString('id-ID')} / pcs)
                          </div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider flex flex-col gap-1 mb-4 pb-4 border-b border-gray-800 dark:border-gray-200">
                            <span>Produk: Rp {basePrice.toLocaleString('id-ID')}</span>
                            <span>{sablonLabel}: Rp {techPrice.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-4">
                            *Harga ini adalah estimasi sistem berdasarkan input Anda. Harga final akan disesuaikan kembali saat proses konfirmasi desain & review oleh tim kami.
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <button 
                    type="submit" 
                    disabled={isSubmitting || isLoadingProducts} 
                    className="w-full flex items-center justify-center gap-2 bg-aria-charcoal text-white dark:bg-white dark:text-black py-5 text-sm font-bold uppercase tracking-[0.2em] hover:bg-black dark:hover:bg-gray-200 transition-all disabled:opacity-50 group"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    {isSubmitting ? (i18n.language === 'EN' ? 'Adding to Cart...' : 'Menambahkan ke Keranjang...') : (i18n.language === 'EN' ? 'Add to Sablon Cart' : 'Tambah ke Keranjang Sablon')}
                  </button>
                  <p className="text-center text-[10px] text-gray-500 mt-4">
                    {t.form.terms}
                  </p>
                </div>
              </div>

            </form>
          )}
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

      {/* Floating Sablon Cart Button */}
      {cartDraftCount > 0 && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="fixed top-28 right-8 bg-aria-charcoal dark:bg-white text-white dark:text-black px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 transition-transform z-50 group border border-white/20 dark:border-black/20"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 bg-aria-maroon text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartDraftCount}
            </span>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest hidden sm:block">
            Keranjang Sablon
          </span>
        </button>
      )}

      <SablonCartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onDraftsChange={(count) => setCartDraftCount(count)}
        onCheckoutSuccess={(data) => {
          setCartDraftCount(0);
          setIsCartOpen(false);
          // Redirect to orders or open payment url
          if (data && data.paymentUrl) {
            window.location.href = data.paymentUrl;
          } else {
            navigate('/account?tab=orders');
          }
        }} 
      />
    </div>
  );
}
// Trigger HMR

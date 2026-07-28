import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '../../services/api';
import useCategoryStore from '../../store/categoryStore';
import useCollectionStore from '../../store/collectionStore';
import useProductTypeStore from '../../store/productTypeStore';
import { FiSave, FiArrowLeft, FiImage, FiPlus, FiTrash2, FiInfo, FiX, FiEdit } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function ProductForm({ defaultBusinessType }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // We determine businessType dynamically in case it's an edit and the product has one.
  const [businessType, setBusinessType] = useState(defaultBusinessType || 'FASHION_RETAIL');
  
  const { categories, fetchCategories } = useCategoryStore();
  const { collections, fetchCollections } = useCollectionStore();
  const { types: productTypes, fetchTypes: fetchProductTypes } = useProductTypeStore();
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  const [mainImageFile, setMainImageFile] = useState(null);
  const [sizeChartFile, setSizeChartFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [variantFiles, setVariantFiles] = useState({});

  // Smart Variant Matrix State
  const [variantColors, setVariantColors] = useState('');
  const [variantSizes, setVariantSizes] = useState('');

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      productName: '',
      description: '',
      descriptionEn: '',
      price: 0,
      stockQuantity: 0,
      categoryId: '',
      productTypeId: '',
      collectionIds: [],
      productType: businessType === 'SABLON_SERVICE' ? 'SABLON_TEMPLATE' : 'KAOS',
      isActive: true,
      trackStock: true,
      isSale: false,
      salePrice: 0,
      tags: '',
      variants: [],
      imageUrl: '',
      sizeChartImage: '',
      imageUrls: [],
      weight_gram: ''
    }
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: "variants"
  });

  const [activeVariantImageIndex, setActiveVariantImageIndex] = useState(null);

  const currentImageUrl = watch('imageUrl');
  const currentSizeChartImage = watch('sizeChartImage');
  const currentImageUrls = watch('imageUrls') || [];
  const currentProductType = watch('productType');
  const isSaleActive = watch('isSale');
  const isTrackStock = watch('trackStock');

  useEffect(() => {
    fetchCategories({ businessType });
    fetchCollections();
    fetchProductTypes();
  }, [businessType, fetchCategories, fetchCollections, fetchProductTypes]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!isEditing) return;
      try {
        const res = await api.get(`/products/${id}`);
        const data = res.data.data;
        if (data) {
          setBusinessType(data.businessType || defaultBusinessType);
          reset({
            productName: data.productName || '',
            description: data.description || '',
            descriptionEn: data.descriptionEn || '',
            price: data.price || 0,
            stockQuantity: data.stockQuantity || 0,
            categoryId: data.categoryId || '',
            productTypeId: data.productTypeId || '',
            collectionIds: data.collectionIds || [],
            productType: data.productType || (data.businessType === 'SABLON_SERVICE' ? 'SABLON_TEMPLATE' : 'KAOS'),
            isActive: data.isActive,
            trackStock: data.trackStock !== undefined ? data.trackStock : true,
            isSale: data.isSale,
            salePrice: data.salePrice || 0,
            tags: data.tags || '',
            variants: data.variants || [],
            imageUrl: data.imageUrl || '',
            sizeChartImage: data.sizeChartImage || '',
            imageUrls: typeof data.imageUrls === 'string' ? JSON.parse(data.imageUrls) : (data.imageUrls || []),
            weight_gram: data.weight_gram || ''
          });
        }
      } catch (err) {
        toast.error('Gagal memuat data produk.');
        navigate(-1);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchProduct();
  }, [id, isEditing, reset, navigate, defaultBusinessType]);

  const generateVariantMatrix = () => {
    const colors = variantColors.split(',').map(c => c.trim()).filter(Boolean);
    const sizes = variantSizes.split(',').map(s => s.trim()).filter(Boolean);
    
    let combinations = [];
    if (colors.length > 0 && sizes.length > 0) {
      colors.forEach(c => {
        sizes.forEach(s => {
          combinations.push(`${c} - ${s}`);
        });
      });
    } else if (colors.length > 0) {
      combinations = [...colors];
    } else if (sizes.length > 0) {
      combinations = [...sizes];
    } else {
      toast.warning('Masukkan setidaknya satu warna atau ukuran.');
      return;
    }

    if (combinations.length > 0) {
      if (!window.confirm(`Sistem akan men-generate ${combinations.length} varian. Varian saat ini (jika ada) tidak akan dihapus. Lanjutkan?`)) return;
      combinations.forEach(combo => {
        appendVariant({ variantName: combo, sku: '', additionalPrice: 0, stockQuantity: 0, colorCode: '#000000' });
      });
      setVariantColors('');
      setVariantSizes('');
      toast.success('Kombinasi varian berhasil digenerate!');
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const uploadRes = await api.post('/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return uploadRes.data?.data?.url || uploadRes.data?.url;
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // 1. Upload Main Image if changed
      let finalImageUrl = data.imageUrl;
      if (mainImageFile) {
        finalImageUrl = await uploadImage(mainImageFile);
      }

      // Upload Size Chart Image if changed
      let finalSizeChartImage = data.sizeChartImage;
      if (sizeChartFile) {
        finalSizeChartImage = await uploadImage(sizeChartFile);
      }

      // 2. Upload Gallery Images if any
      let finalImageUrls = [...currentImageUrls];
      if (galleryFiles.length > 0) {
        for (const file of galleryFiles) {
          const url = await uploadImage(file);
          if (url) finalImageUrls.push(url);
        }
      }

      // 3. Upload Variant Images
      const finalVariants = [...data.variants];
      for (const [keyStr, fileOrRef] of Object.entries(variantFiles)) {
        if (!fileOrRef) continue;
        
        let idxStr = keyStr;
        let side = 'front';
        if (keyStr.includes('_')) {
          [idxStr, side] = keyStr.split('_');
        }
        const idx = parseInt(idxStr, 10);
        
        if (finalVariants[idx]) {
          let urlToSet = null;
          if (fileOrRef === 'MAIN_IMAGE') {
            urlToSet = finalImageUrl;
          } else if (typeof fileOrRef === 'string' && fileOrRef.startsWith('GALLERY_')) {
            const galIdx = parseInt(fileOrRef.split('_')[1], 10);
            urlToSet = finalImageUrls[currentImageUrls.length + galIdx];
          } else if (fileOrRef instanceof File) {
            urlToSet = await uploadImage(fileOrRef);
          }

          if (urlToSet) {
            if (side === 'front') finalVariants[idx].imageUrl = urlToSet;
            if (side === 'back') finalVariants[idx].imageUrlBack = urlToSet;
            if (side === 'left') finalVariants[idx].imageUrlLeft = urlToSet;
            if (side === 'right') finalVariants[idx].imageUrlRight = urlToSet;
          }
        }
      }

      const payload = {
        ...data,
        variants: finalVariants,
        imageUrl: finalImageUrl,
        sizeChartImage: finalSizeChartImage,
        imageUrls: finalImageUrls,
        businessType: businessType,
        price: Number(data.price),
        salePrice: Number(data.salePrice) || null,
        stockQuantity: Number(data.stockQuantity)
      };

      if (isEditing) {
        await api.put(`/products/${id}`, payload);
        toast.success('Produk berhasil diperbarui!');
      } else {
        await api.post('/products', payload);
        toast.success('Produk berhasil ditambahkan!');
      }
      
      navigate(-1);
    } catch (err) {
      toast.error('Gagal menyimpan produk: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const removeGalleryImage = (indexToRemove) => {
    const newImageUrls = currentImageUrls.filter((_, idx) => idx !== indexToRemove);
    setValue('imageUrls', newImageUrls);
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 relative">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <FiArrowLeft className="text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}
          </h2>
          <p className="text-gray-500 text-sm">
            {businessType === 'FASHION_RETAIL' ? 'Manajemen inventaris retail e-commerce' : 'Manajemen bahan dasar custom sablon'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <h3 className="font-bold text-lg text-gray-800 border-b pb-3">Informasi Utama</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
                <input
                  {...register('productName', { required: 'Nama produk wajib diisi' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
                  placeholder="Contoh: Kaos Polos Hitam 30s"
                />
                {errors.productName && <p className="text-red-500 text-xs mt-1">{errors.productName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi (Bahasa Indonesia)</label>
                <textarea
                  {...register('description')}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
                  placeholder="Tuliskan deskripsi produk dalam Bahasa Indonesia..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi (Bahasa Inggris)</label>
                <textarea
                  {...register('descriptionEn')}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
                  placeholder="Write the product description in English..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp) *</label>
                  <input
                    type="number"
                    {...(isTrackStock ? register('price', { required: 'Harga wajib diisi' }) : { value: 0 })}
                    disabled={!isTrackStock}
                    className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all ${!isTrackStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stok Tersedia *</label>
                  <input
                    type={isTrackStock ? "number" : "text"}
                    {...(isTrackStock ? register('stockQuantity') : { value: '∞' })}
                    disabled={variantFields.length > 0 || !isTrackStock}
                    className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all ${variantFields.length > 0 || !isTrackStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''} ${!isTrackStock ? 'text-center font-bold text-lg' : ''}`}
                    placeholder="0"
                  />
                  {variantFields.length > 0 && isTrackStock && <p className="text-[10px] text-orange-500 mt-1">Diambil otomatis dari total stok varian.</p>}
                  {!isTrackStock && <p className="text-[10px] text-blue-500 mt-1 font-medium">Stok & Harga diabaikan (Bypass) karena mode Tanpa Batas / Bawa Sendiri.</p>}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Berat per Pcs (Gram) *</label>
                <input
                  type="number"
                  {...register('weight_gram', { required: 'Berat per Pcs wajib diisi' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
                  placeholder="Contoh: 150, 250, 50"
                />
                {errors.weight_gram && <p className="text-red-500 text-xs mt-1">{errors.weight_gram.message}</p>}
                <p className="text-[10px] text-gray-500 mt-1">Wajib diisi agar kalkulasi ongkos kirim menjadi presisi (Misal: Kaos=250, Topi=100, Tote Bag=150).</p>
              </div>
            </div>

            {/* Variants Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">Manajemen Varian Produk</h3>
                  <p className="text-xs text-gray-500 mt-1">Buat variasi produk berdasarkan Warna dan Ukuran secara otomatis.</p>
                </div>
              </div>
              
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
                <h4 className="text-sm font-semibold text-blue-900 mb-3">Generate Kombinasi Otomatis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Opsi Warna (pisahkan koma)</label>
                    <input 
                      type="text" 
                      value={variantColors}
                      onChange={(e) => setVariantColors(e.target.value)}
                      placeholder="Hitam, Putih, Navy" 
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Opsi Ukuran (pisahkan koma)</label>
                    <input 
                      type="text" 
                      value={variantSizes}
                      onChange={(e) => setVariantSizes(e.target.value)}
                      placeholder={businessType === 'SABLON_SERVICE' ? "mis: S, M, L atau 10x15cm, One Size" : "S, M, L, XL"} 
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={generateVariantMatrix}
                    className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    Generate Kombinasi Varian
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6 mb-2">
                <h4 className="font-semibold text-sm text-gray-800">Daftar Varian ({variantFields.length})</h4>
                <button
                  type="button"
                  onClick={() => appendVariant({ variantName: '', sku: '', additionalPrice: 0, stockQuantity: 0, colorCode: '#000000' })}
                  className="text-xs font-semibold bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <FiPlus /> Tambah Manual
                </button>
              </div>
              
              {variantFields.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  Tidak ada varian (warna/ukuran). Produk ini dianggap single-variant.
                </p>
              ) : (
                <div className="space-y-4">
                  {variantFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div className="col-span-1 flex flex-col items-center justify-end pb-1">
                        <label className="block text-[10px] font-medium text-gray-600 mb-1 text-center w-full leading-tight">Foto<br/>(4 Sisi)</label>
                        <div className="grid grid-cols-2 gap-1 w-[40px] h-[40px]">
                          {[
                            { side: 'front', label: 'Depan', field: 'imageUrl' },
                            { side: 'back', label: 'Belakang', field: 'imageUrlBack' },
                            { side: 'left', label: 'Kiri', field: 'imageUrlLeft' },
                            { side: 'right', label: 'Kanan', field: 'imageUrlRight' }
                          ].map((item) => {
                            const key = `${index}_${item.side}`;
                            const fileOrRef = variantFiles[key];
                            const watchedUrl = watch(`variants.${index}.${item.field}`);
                            
                            return (
                              <div key={item.side} className="relative w-[18px] h-[18px] group" title={`Pilih Foto ${item.label}`}>
                                {(fileOrRef || watchedUrl) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setVariantFiles(prev => {
                                        const newFiles = { ...prev };
                                        delete newFiles[key];
                                        return newFiles;
                                      });
                                      setValue(`variants.${index}.${item.field}`, '', { shouldDirty: true });
                                    }}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-[1px] shadow-sm z-20 hover:bg-red-600 hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <FiX size={8} strokeWidth={3} />
                                  </button>
                                )}
                                <div
                                  onClick={() => setActiveVariantImageIndex(key)}
                                  className="w-full h-full border border-gray-300 rounded bg-white flex items-center justify-center overflow-hidden hover:border-black cursor-pointer relative z-10"
                                >
                                  {fileOrRef ? (
                                    <img src={
                                      fileOrRef === 'MAIN_IMAGE' 
                                        ? (mainImageFile ? URL.createObjectURL(mainImageFile) : (currentImageUrl || ''))
                                        : (typeof fileOrRef === 'string' && fileOrRef.startsWith('GALLERY_'))
                                          ? (galleryFiles[parseInt(fileOrRef.split('_')[1])] ? URL.createObjectURL(galleryFiles[parseInt(fileOrRef.split('_')[1])]) : '')
                                          : (fileOrRef instanceof File ? URL.createObjectURL(fileOrRef) : '')
                                    } alt="preview" className="w-full h-full object-cover" />
                                  ) : watchedUrl ? (
                                    <img src={watchedUrl} alt="variant" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[8px] font-bold text-gray-400 group-hover:text-black">{item.label.charAt(0)}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nama Varian (mis: XL Merah)</label>
                        <input
                          {...register(`variants.${index}.variantName`, { required: true })}
                          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-black outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Warna Hex</label>
                        <div className="flex items-center border border-gray-200 rounded-md bg-white px-2 h-[34px]">
                          <input
                            type="color"
                            value={watch(`variants.${index}.colorCode`) || '#000000'}
                            onChange={(e) => setValue(`variants.${index}.colorCode`, e.target.value, { shouldValidate: true, shouldDirty: true })}
                            className="w-6 h-6 border-0 p-0 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            {...register(`variants.${index}.colorCode`)}
                            placeholder="#000000"
                            className="w-full ml-2 text-xs outline-none bg-transparent"
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">SKU</label>
                        <input
                          {...register(`variants.${index}.sku`)}
                          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-black outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Stok</label>
                        <input
                          type={isTrackStock ? "number" : "text"}
                          {...(isTrackStock ? register(`variants.${index}.stockQuantity`) : { value: '∞' })}
                          disabled={!isTrackStock}
                          className={`w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-black outline-none ${!isTrackStock ? 'bg-gray-100 text-gray-500 cursor-not-allowed text-center font-bold text-lg' : ''}`}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">+ Harga</label>
                        <input
                          type="number"
                          {...(isTrackStock ? register(`variants.${index}.additionalPrice`) : { value: 0 })}
                          disabled={!isTrackStock}
                          className={`w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-black outline-none ${!isTrackStock ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                        />
                      </div>
                      <div className="col-span-1 flex justify-end pb-1">
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Hapus Varian"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-gray-800 border-b pb-3">Organisasi</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                <select
                  {...register('categoryId', { required: 'Kategori wajib dipilih' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name || cat.categoryName}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
              </div>

              {businessType === 'FASHION_RETAIL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Produk</label>
                  <select
                    {...register('productTypeId')}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white"
                  >
                    <option value="">-- Pilih Tipe --</option>
                    {productTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.typeName}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1">Menentukan posisi produk di menu navbar by type (misal: Celana, Hoodie).</p>
                </div>
              )}

              {businessType === 'FASHION_RETAIL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Koleksi (Bisa lebih dari satu)</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                    {collections.length === 0 ? (
                      <p className="text-xs text-gray-500 italic text-center py-2">Belum ada koleksi</p>
                    ) : collections.map(col => (
                      <label key={col.id} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          value={col.id}
                          {...register('collectionIds')}
                          className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                        />
                        <span className="text-sm text-gray-700">{col.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (pisahkan koma)</label>
                <input
                  {...register('tags')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none"
                  placeholder={businessType === 'SABLON_SERVICE' ? "kertas, plastik, tas-kertas" : "hitam, katun, murah"}
                />
              </div>
              <input type="hidden" {...register('productType')} />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
              <h3 className="font-bold text-lg text-gray-800 border-b pb-3">Media</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Foto Utama</label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden aspect-square group">
                  {(mainImageFile || currentImageUrl) ? (
                    <>
                      <img 
                        src={mainImageFile ? URL.createObjectURL(mainImageFile) : currentImageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20">
                        <button
                          type="button"
                          onClick={() => document.getElementById('mainImageInput').click()}
                          className="bg-white text-gray-900 p-2 rounded-full hover:bg-gray-200 transition-colors shadow-md"
                          title="Ganti Foto"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMainImageFile(null);
                            setValue('imageUrl', '');
                          }}
                          className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-md"
                          title="Hapus Foto"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div 
                      className="text-center text-gray-400 w-full h-full flex flex-col justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => document.getElementById('mainImageInput').click()}
                    >
                      <FiImage className="mx-auto h-12 w-12 mb-2" />
                      <span className="text-xs font-medium">Klik / Drag Foto</span>
                    </div>
                  )}
                  <input
                    id="mainImageInput"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setMainImageFile(e.target.files[0])}
                    className="hidden"
                  />
                </div>
              </div>

                {/* SIZE CHART IMAGE PICKER (CONDITIONAL) */}
                {businessType === 'SABLON_SERVICE' && categories.find(c => c.id === watch('categoryId'))?.name?.toLowerCase().includes('pakaian') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gambar Size Chart (Khusus Pakaian)</label>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden aspect-video group">
                      {(sizeChartFile || currentSizeChartImage) ? (
                        <>
                          <img 
                            src={sizeChartFile ? URL.createObjectURL(sizeChartFile) : currentSizeChartImage} 
                            alt="Size Chart" 
                            className="w-full h-full object-contain" 
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col gap-2 items-center justify-center transition-opacity">
                            <label htmlFor="sizeChartInput" className="bg-white text-gray-800 px-4 py-2 rounded-full cursor-pointer hover:bg-gray-100 transition-colors shadow-md text-sm font-medium">
                              Ganti
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setSizeChartFile(null);
                                setValue('sizeChartImage', '');
                              }}
                              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-md"
                              title="Hapus Size Chart"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </>
                      ) : (
                        <label htmlFor="sizeChartInput" className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                          <FiImage className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-sm font-medium text-gray-600">Upload Size Chart</span>
                        </label>
                      )}
                      <input
                        id="sizeChartInput"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSizeChartFile(e.target.files[0])}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between">
                  <span>Galeri Tambahan</span>
                  <span className="text-xs text-gray-400">{currentImageUrls.length + galleryFiles.length} foto</span>
                </label>
                
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {currentImageUrls.map((url, idx) => (
                    <div key={'cur'+idx} className="relative aspect-square border rounded-lg overflow-hidden group">
                      <img src={url} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                  {galleryFiles.map((f, idx) => (
                    <div key={'new'+idx} className="relative aspect-square border rounded-lg overflow-hidden border-blue-200">
                      <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setGalleryFiles(prev => prev.filter((_, i) => i !== idx))} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                  
                  <div className="relative aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                    <FiPlus className="h-6 w-6" />
                    <span className="text-[10px] mt-1">Tambah</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setGalleryFiles(prev => [...prev, ...Array.from(e.target.files)])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 flex items-start gap-1">
                  <FiInfo className="shrink-0 mt-0.5" /> Opsional. Digunakan sebagai gambar carousel detail produk.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-gray-800 border-b pb-3">Status Produk</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-800">Status Aktif</h4>
                  <p className="text-xs text-gray-500">Tampilkan produk ini di etalase/katalog.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('isActive')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-800">Lacak Stok (Track Stock)</h4>
                  <p className="text-xs text-gray-500">Jika dimatikan, stok tidak akan pernah habis (Bypass). Khusus untuk item "Bawa Sendiri".</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('trackStock')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {businessType !== 'SABLON_SERVICE' && (
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">Sedang Sale?</h4>
                    <p className="text-xs text-gray-500">Tandai produk ini sedang diskon.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" {...register('isSale')} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                  </label>
                </div>
              )}

              {isSaleActive && (
                <div className="pt-3 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Diskon / Sale (Rp) *</label>
                  <input
                    type="number"
                    {...register('salePrice')}
                    className="w-full px-4 py-2 border border-red-200 bg-red-50/30 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    placeholder="Contoh: 89000"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-50 flex items-center justify-end gap-4 bg-white/90 backdrop-blur-md py-4 mt-8 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-8 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <FiSave />
            )}
            {loading ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Terbitkan Produk')}
          </button>
        </div>
      </form>

      {/* Variant Image Picker Modal */}
      {activeVariantImageIndex !== null && (
        (() => {
          let activeVariantIdx = activeVariantImageIndex;
          let activeVariantSide = 'front';
          if (typeof activeVariantImageIndex === 'string' && activeVariantImageIndex.includes('_')) {
            const parts = activeVariantImageIndex.split('_');
            activeVariantIdx = parts[0];
            activeVariantSide = parts[1];
          }
          const sideLabel = activeVariantSide === 'front' ? 'Depan' : activeVariantSide === 'back' ? 'Belakang' : activeVariantSide === 'left' ? 'Kiri' : 'Kanan';
          const watchField = activeVariantSide === 'front' ? 'imageUrl' : activeVariantSide === 'back' ? 'imageUrlBack' : activeVariantSide === 'left' ? 'imageUrlLeft' : 'imageUrlRight';

          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-bold text-gray-800">Pilih Foto Varian ({sideLabel})</h3>
                  <button onClick={() => setActiveVariantImageIndex(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                    <FiX />
                  </button>
                </div>
                
                <div className="p-4 overflow-y-auto">
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Upload Foto Baru</p>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FiPlus className="text-gray-400 mb-2" size={24} />
                        <p className="text-sm text-gray-600 font-medium">Klik untuk upload foto</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            setVariantFiles(prev => ({ ...prev, [activeVariantImageIndex]: e.target.files[0] }));
                            setActiveVariantImageIndex(null);
                          }
                        }} 
                      />
                    </label>
                  </div>

                  {(mainImageFile || galleryFiles.length > 0) && (
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Media yang Sedang Diupload</p>
                      <div className="grid grid-cols-4 gap-3">
                        {mainImageFile && (
                          <button 
                            type="button"
                            onClick={() => {
                              setVariantFiles(prev => ({ ...prev, [activeVariantImageIndex]: 'MAIN_IMAGE' }));
                              setActiveVariantImageIndex(null);
                            }}
                            className="aspect-square border border-gray-200 rounded-lg overflow-hidden hover:border-black hover:shadow-md transition-all relative group"
                          >
                            <div className="absolute top-1 left-1 bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded uppercase font-bold z-10">Utama Baru</div>
                            <img src={URL.createObjectURL(mainImageFile)} alt="Main New" className="w-full h-full object-cover" />
                          </button>
                        )}
                        {galleryFiles.map((file, i) => (
                          <button 
                            key={`gal-new-${i}`}
                            type="button"
                            onClick={() => {
                              setVariantFiles(prev => ({ ...prev, [activeVariantImageIndex]: `GALLERY_${i}` }));
                              setActiveVariantImageIndex(null);
                            }}
                            className="aspect-square border border-gray-200 rounded-lg overflow-hidden hover:border-black hover:shadow-md transition-all group relative"
                          >
                            <div className="absolute top-1 left-1 bg-gray-500 text-white text-[8px] px-1.5 py-0.5 rounded uppercase font-bold z-10">Galeri Baru</div>
                            <img src={URL.createObjectURL(file)} alt={`Gallery New ${i}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {((!mainImageFile && currentImageUrl && currentImageUrl !== '') || currentImageUrls.length > 0) && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Pilih dari Galeri Produk</p>
                      <div className="grid grid-cols-4 gap-3">
                        {!mainImageFile && currentImageUrl && currentImageUrl !== '' && (
                          <button 
                            type="button"
                            onClick={() => {
                              setValue(`variants.${activeVariantIdx}.${watchField}`, currentImageUrl, { shouldDirty: true });
                              setActiveVariantImageIndex(null);
                            }}
                            className="aspect-square border border-gray-200 rounded-lg overflow-hidden hover:border-black hover:shadow-md transition-all relative group"
                          >
                            <div className="absolute top-1 left-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded uppercase font-bold z-10">Utama</div>
                            <img src={currentImageUrl} alt="Main" className="w-full h-full object-cover" />
                          </button>
                        )}
                        {currentImageUrls.map((url, i) => url && (
                          <button 
                            key={i}
                            type="button"
                            onClick={() => {
                              setValue(`variants.${activeVariantIdx}.${watchField}`, url, { shouldDirty: true });
                              setActiveVariantImageIndex(null);
                            }}
                            className="aspect-square border border-gray-200 rounded-lg overflow-hidden hover:border-black hover:shadow-md transition-all group"
                          >
                            <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}

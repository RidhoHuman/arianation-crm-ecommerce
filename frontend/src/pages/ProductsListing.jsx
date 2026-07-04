import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';
import Breadcrumb from '../components/Breadcrumb';
import OptimizedImage from '../components/OptimizedImage';
import api from '../services/api';
import { Shirt, Briefcase, Tent, Flame, Zap, Activity } from 'lucide-react';

import useCategoryStore from '../store/categoryStore';
import useCollectionStore from '../store/collectionStore';
import useProductTypeStore from '../store/productTypeStore';
import useUIStore from '../store/uiStore';

const getCategoryIcon = (name) => {
  const n = (name || '').toLowerCase();
  const iconClass = "w-4 h-4";
  if (n.includes('everyday')) return <Shirt className={iconClass} />;
  if (n.includes('work')) return <Briefcase className={iconClass} />;
  if (n.includes('adventure') || n.includes('outdoor')) return <Tent className={iconClass} />;
  if (n.includes('stories') || n.includes('heritage')) return <Flame className={iconClass} />;
  if (n.includes('street')) return <Zap className={iconClass} />;
  if (n.includes('active')) return <Activity className={iconClass} />;
  return <Shirt className={iconClass} />;
};

const getTranslatedCategoryName = (name, lang) => {
  if (!name) return '';
  const lower = name.toLowerCase();
  if (lang === 'ID') {
    if (lower.includes('everyday')) return 'Sehari-hari';
    if (lower.includes('heritage')) return 'Klasik (Heritage)';
    if (lower.includes('outdoor')) return 'Luar Ruang';
    if (lower.includes('street')) return 'Jalanan';
    if (lower.includes('active')) return 'Aktif';
  } else {
    if (lower.includes('everyday')) return 'Everyday';
    if (lower.includes('heritage')) return 'Heritage';
    if (lower.includes('outdoor')) return 'Outdoor';
    if (lower.includes('street')) return 'Street';
    if (lower.includes('active')) return 'Active';
  }
  return name;
};

export default function ProductsListing() {
  const language = useUIStore((s) => s.language) || 'ID';
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { categories, fetchCategories, isLoading: catsLoading } = useCategoryStore();
  const activeCategories = categories.filter(c => c.isActive && c.businessType === 'FASHION_RETAIL');

  const { collections, fetchCollections, isLoading: colsLoading } = useCollectionStore();
  const activeCollections = collections.filter(c => c.isActive);

  const { types, fetchTypes, isLoading: typesLoading } = useProductTypeStore();
  const activeTypes = types.filter(t => t.isActive);

  const categoryFilter = searchParams.get('category') || '';
  const activeCategory = activeCategories.find((c) => c.slug === categoryFilter || c.id === categoryFilter);

  const collectionFilter = searchParams.get('collection') || '';
  const activeCollection = activeCollections.find((c) => c.slug === collectionFilter || c.id === collectionFilter);

  const typeFilter = searchParams.get('type') || '';
  const activeType = activeTypes.find((t) => t.slug === typeFilter || t.id === typeFilter);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  useEffect(() => {
    fetchCategories();
    fetchCollections();
    fetchTypes();
  }, [fetchCategories, fetchCollections, fetchTypes]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (catsLoading || colsLoading || typesLoading) return;

      try {
        setLoading(true);
        let url = `/products?page=${page}&limit=12&businessType=FASHION_RETAIL`;

        const resolvedCategoryId = activeCategory ? activeCategory.id : categoryFilter;
        if (resolvedCategoryId) url += `&category=${resolvedCategoryId}`;

        const resolvedCollectionId = activeCollection ? activeCollection.id : collectionFilter;
        if (resolvedCollectionId) url += `&collection=${resolvedCollectionId}`;

        const resolvedTypeId = activeType ? activeType.id : typeFilter;
        if (resolvedTypeId) url += `&type=${resolvedTypeId}`;

        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

        const res = await api.get(url);
        setProducts(res.data.data || res.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setLoading(false);
      } catch (e) {
        setError(e?.response?.data?.message || 'Gagal mengambil produk');
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, categoryFilter, collectionFilter, typeFilter, searchQuery, catsLoading, colsLoading, typesLoading, activeCategory, activeCollection, activeType]);

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleCategoryChange = (categoryId) => {
    const params = {};
    if (categoryId) params.category = categoryId;
    if (collectionFilter) params.collection = collectionFilter;
    if (typeFilter) params.type = typeFilter;
    if (searchQuery) params.search = searchQuery;
    setSearchParams(params);
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (categoryFilter) params.category = categoryFilter;
    if (collectionFilter) params.collection = collectionFilter;
    if (typeFilter) params.type = typeFilter;
    if (searchQuery) params.search = searchQuery;

    setSearchParams(params);
    setPage(1);
  };

  const TRANSLATIONS = {
    ID: {
      allProducts: 'Semua Produk',
      searchResult: 'Hasil Pencarian',
      descCategory: 'Koleksi fashion premium untuk gaya khas Anda.',
      descType: 'Koleksi premium dari Arianation.',
      descAll: 'Jelajahi koleksi lengkap produk Arianation. Kualitas terbaik dengan desain versatile untuk berbagai aktivitas.',
      categoryLabel: 'Kategori',
      allLabel: 'Semua',
      searchPlaceholder: 'Cari produk...',
      searchBtn: 'Cari',
      loading: 'Loading produk...',
      noProducts: 'Tidak ada produk ditemukan',
      viewAll: 'Lihat semua produk',
      noImage: 'Tidak ada gambar',
      stockLabel: 'Stok',
      outOfStock: 'Habis',
      prev: 'Sebelumnya',
      next: 'Selanjutnya',
    },
    EN: {
      allProducts: 'All Products',
      searchResult: 'Search Results',
      descCategory: 'Premium fashion collection for your signature style.',
      descType: 'Premium collection from Arianation.',
      descAll: 'Explore the complete Arianation product collection. The best quality with versatile designs for various activities.',
      categoryLabel: 'Category',
      allLabel: 'All',
      searchPlaceholder: 'Search products...',
      searchBtn: 'Search',
      loading: 'Loading products...',
      noProducts: 'No products found',
      viewAll: 'View all products',
      noImage: 'No image',
      stockLabel: 'Stock',
      outOfStock: 'Out of Stock',
      prev: 'Previous',
      next: 'Next',
    }
  };
  const t = TRANSLATIONS[language];

  const getPageTitle = () => {
    if (activeCategory) return `${getTranslatedCategoryName(activeCategory.categoryName || activeCategory.name, language)} Collection`;
    if (activeCollection) return `${activeCollection.collectionName || activeCollection.name} Collection`;
    if (activeType) return `${activeType.typeName} Products`;
    if (searchQuery) return `${t.searchResult}: ${searchQuery}`;
    return t.allProducts;
  };

  const getPageDescription = () => {
    if (activeCategory) return `Explore our ${getTranslatedCategoryName(activeCategory.categoryName || activeCategory.name, language)} collection. ${activeCategory.description || t.descCategory}`;
    if (activeCollection) return `Explore our ${activeCollection.collectionName || activeCollection.name} collection. ${activeCollection.description || t.descCategory}`;
    if (activeType) return `${t.descType} - ${activeType.typeName}`;
    return t.descAll;
  };

  const productsListStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: getPageTitle(),
    url: 'https://arianation.com/products',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.slice(0, 5).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://arianation.com/products/${product.id}`,
        name: product.productName,
      })),
    },
  };

  return (
    <>
      <SEOHead
        title={`${getPageTitle()} - Arianation`}
        description={getPageDescription()}
        image="https://arianation.com/og-products.png"
        url="https://arianation.com/products"
        type="website"
        structuredData={productsListStructuredData}
      />

      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="max-w-6xl mx-auto p-6 pt-8">
          <div className="mb-6">
            <Breadcrumb />
          </div>

          <motion.h1
            className="text-4xl font-bold mb-2 tracking-tight"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {getPageTitle()}
          </motion.h1>
          <motion.p
            className="text-gray-600 mb-8 max-w-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {getPageDescription()}
          </motion.p>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-aria-charcoal"
              />
              <button
                type="submit"
                className="bg-aria-charcoal text-white px-6 py-2 rounded-lg hover:bg-aria-maroon transition"
              >
                {t.searchBtn}
              </button>
            </div>
          </form>

          <div className="mb-8">
            <h2 className="text-sm font-bold mb-3 text-gray-700">{t.categoryLabel}</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleCategoryChange('')}
                className={`px-4 py-2 rounded-lg font-medium transition ${!categoryFilter
                  ? 'bg-aria-charcoal text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
              >
                {t.allLabel}
              </button>
              {activeCategories.map((cat) => {
                const catIdentifier = cat.slug || cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(catIdentifier)}
                    className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${categoryFilter === catIdentifier
                      ? 'bg-aria-charcoal text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                  >
                    <span>{getCategoryIcon(cat.categoryName || cat.name)}</span>
                    <span>{getTranslatedCategoryName(cat.categoryName || cat.name, language)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-8">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <p className="text-center py-12">{t.loading}</p>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">{t.noProducts}</p>
              <button
                onClick={() => handleCategoryChange('')}
                className="text-aria-maroon font-medium hover:underline"
              >
                {t.viewAll}
              </button>
            </div>
          ) : (
            <>
              <motion.div
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + (index * 0.05) }}
                  >
                    <Link to={`/products/${product.id}`} className="group flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
                      <div className="relative bg-gray-100 aspect-[4/5] mb-4 transition-all rounded overflow-hidden">
                        {product.imageUrl ? (
                          <OptimizedImage
                            publicId={product.imageUrl}
                            alt={product.productName}
                            width={400}
                            height={500}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                            loading="lazy"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-gray-500">{t.noImage}</span>
                          </div>
                        )}

                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          {product.is_limited && (
                            <span className="bg-aria-maroon text-white px-2 py-1 text-xs font-bold rounded shadow-sm">
                              LIMITED
                            </span>
                          )}
                          {product.isNew && (
                            <span className="bg-black text-white px-2 py-1 text-xs font-bold rounded shadow-sm">
                              NEW
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col flex-1 px-1">
                        <h3 className="text-sm md:text-base font-semibold text-aria-charcoal mb-1 line-clamp-2 leading-snug group-hover:text-aria-maroon transition-colors">
                          {product.productName}
                        </h3>
                        <div className="mt-auto pt-2 flex flex-col gap-1">
                          <p className="font-bold text-aria-charcoal text-sm md:text-base">Rp {product.price?.toLocaleString('id-ID')}</p>
                          <p className="text-xs text-gray-500">
                            {product.stockQuantity > 0 ? `${t.stockLabel}: ${product.stockQuantity}` : t.outOfStock}
                          </p>
                        </div>
                        {product.versatile_uses && (
                          <div className="mt-2 flex flex-wrap gap-1 mb-1">
                            {(typeof product.versatile_uses === 'string' ? product.versatile_uses.split(',') : product.versatile_uses)
                              .slice(0, 2)
                              .map((use, idx) => (
                                <span key={idx} className="text-[9px] bg-aria-cream px-2 py-1 rounded-sm text-gray-600 uppercase tracking-widest font-medium">
                                  {use.trim()}
                                </span>
                              ))}
                          </div>
                        )}
                        {product.category && (
                          <div className="mt-2">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                              {getTranslatedCategoryName(product.category.categoryName, language)}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-100"
                  >
                    {t.prev}
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-4 py-2 border rounded ${page === pageNum ? 'bg-aria-charcoal text-white' : 'hover:bg-gray-100'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-100"
                  >
                    {t.next}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import Breadcrumb from '../components/Breadcrumb';
import OptimizedImage from '../components/OptimizedImage';
import api from '../services/api';

const CATEGORIES = [
  { id: 'everyday', name: 'Everyday', icon: '👕', description: 'Versatile untuk semua aktivitas' },
  { id: 'work', name: 'Work', icon: '💼', description: 'Professional yet cool' },
  { id: 'adventure', name: 'Adventure', icon: '🏔️', description: 'Outdoor-ready pieces' },
  { id: 'stories', name: 'Stories', icon: '📖', description: 'Limited edition dengan authentic cerita' },
];

export default function ProductsListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Get category from URL params
  const categoryFilter = searchParams.get('category') || '';
  const activeCategory = CATEGORIES.find((c) => c.id === categoryFilter);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let url = `/products?page=${page}&limit=12`;
        
        if (categoryFilter) {
          url += `&category=${categoryFilter}`;
        }
        
        if (searchQuery) {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }
        
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
  }, [page, categoryFilter, searchQuery]);

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleCategoryChange = (categoryId) => {
    const params = {};
    if (categoryId) {
      params.category = categoryId;
    }
    if (searchQuery) {
      params.search = searchQuery;
    }
    setSearchParams(params);
    setPage(1); // Reset to first page when changing category
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (categoryFilter) {
      params.category = categoryFilter;
    }
    if (searchQuery) {
      params.search = searchQuery;
    }
    setSearchParams(params);
    setPage(1); // Reset to first page when searching
  };

  const productsListStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: categoryFilter 
      ? `${CATEGORIES.find(c => c.id === categoryFilter)?.name || ''} Collection` 
      : 'Semua Produk',
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
        title={categoryFilter 
          ? `${CATEGORIES.find(c => c.id === categoryFilter)?.name || ''} Collection - Arianation` 
          : 'Semua Produk - Arianation'}
        description={categoryFilter 
          ? `Explore our ${CATEGORIES.find(c => c.id === categoryFilter)?.name} collection. ${CATEGORIES.find(c => c.id === categoryFilter)?.description}.`
          : 'Jelajahi koleksi lengkap produk Arianation. Kualitas terbaik dengan desain versatile untuk berbagai aktivitas.'}
        image="https://arianation.com/og-products.png"
        url="https://arianation.com/products"
        type="website"
        structuredData={productsListStructuredData}
      />

      <Breadcrumb />

      <div className="max-w-6xl mx-auto mt-8 p-6">
        <h1 className="text-4xl font-bold mb-2">
          {categoryFilter 
            ? `${CATEGORIES.find(c => c.id === categoryFilter)?.name || ''} Collection` 
            : 'Semua Produk'}
        </h1>
        <p className="text-gray-600 mb-8">
          {categoryFilter 
            ? activeCategory?.description || 'Temukan produk Arianation dengan kualitas terbaik dan desain versatile untuk gaya sehari-hari, kerja, dan petualangan.'
            : 'Temukan produk Arianation dengan kualitas terbaik dan desain versatile untuk gaya sehari-hari, kerja, dan petualangan.'}
        </p>

        {/* Category Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/categories/${cat.id}`}
              className="group rounded-3xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-4xl mb-4">{cat.icon}</div>
              <h3 className="text-lg font-bold mb-2">{cat.name}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{cat.description}</p>
            </Link>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-aria-charcoal"
            />
            <button 
              type="submit"
              className="bg-aria-charcoal text-white px-6 py-2 rounded-lg hover:bg-aria-maroon transition"
            >
              Cari
            </button>
          </div>
        </form>

        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-sm font-bold mb-3 text-gray-700">Kategori</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleCategoryChange('')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                !categoryFilter
                  ? 'bg-aria-charcoal text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Semua
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  categoryFilter === cat.id
                    ? 'bg-aria-charcoal text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <p className="text-center py-12">Loading produk...</p>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Tidak ada produk ditemukan</p>
            <button
              onClick={() => handleCategoryChange('')}
              className="text-aria-maroon font-medium hover:underline"
            >
              Lihat semua produk
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
              {products.map((product) => (
                <Link key={product.id} to={`/products/${product.id}`} className="group">
                  <div className="relative bg-gray-100 aspect-square mb-4 hover:bg-gray-200 transition-all rounded overflow-hidden">
                    {product.imageUrl ? (
                      <OptimizedImage
                        publicId={product.imageUrl}
                        alt={product.productName}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-gray-500">Tidak ada gambar</span>
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      {product.is_limited && (
                        <span className="bg-aria-maroon text-white px-2 py-1 text-xs font-bold rounded">
                          LIMITED
                        </span>
                      )}
                      {product.isNew && (
                        <span className="bg-blue-600 text-white px-2 py-1 text-xs font-bold rounded">
                          NEW
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-black mb-2 line-clamp-2">
                    {product.productName}
                  </h3>
                  <p className="font-bold text-blue-600">Rp {product.price?.toLocaleString('id-ID')}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {product.stockQuantity > 0 ? `Stok: ${product.stockQuantity}` : 'Habis'}
                  </p>
                  {product.versatile_uses && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(typeof product.versatile_uses === 'string' ? product.versatile_uses.split(',') : product.versatile_uses)
                        .slice(0, 2)
                        .map((use, idx) => (
                          <span key={idx} className="text-[10px] bg-aria-cream px-2 py-1 rounded-full text-aria-charcoal uppercase tracking-[0.08em]">
                            {use.trim()}
                          </span>
                        ))}
                    </div>
                  )}
                  
                  {/* Show category badge */}
                  {product.category && (
                    <div className="mt-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {product.category.categoryName}
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-100"
                >
                  Sebelumnya
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
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
                      className={`px-4 py-2 border rounded ${
                        page === pageNum ? 'bg-aria-charcoal text-white' : 'hover:bg-gray-100'
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
                  Selanjutnya
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

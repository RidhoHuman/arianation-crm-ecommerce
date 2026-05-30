import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import Breadcrumb from '../components/Breadcrumb';
import OptimizedImage from '../components/OptimizedImage';
import api from '../services/api';

export default function ProductsListing() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get(`/products?page=${page}&limit=12`);
        setProducts(res.data.data || res.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setLoading(false);
      } catch (e) {
        setError(e?.response?.data?.message || 'Gagal mengambil produk');
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page]);

  const productsListStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Semua Produk',
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
        title="Semua Produk - Sablon & Fashion"
        description="Jelajahi koleksi lengkap produk sablon dan fashion berkualitas tinggi. Ribuan pilihan dengan harga terjangkau dan pengiriman cepat ke seluruh Indonesia."
        image="https://arianation.com/og-products.png"
        url="https://arianation.com/products"
        type="website"
        structuredData={productsListStructuredData}
      />

      <Breadcrumb />

      <div className="max-w-6xl mx-auto mt-8 p-6">
        <h1 className="text-4xl font-bold mb-2">Semua Produk</h1>
        <p className="text-gray-600 mb-8">Temukan produk sablon dan fashion pilihan kami dengan kualitas terbaik</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <p className="text-center py-12">Loading produk...</p>
        ) : products.length === 0 ? (
          <p className="text-center py-12 text-gray-600">Tidak ada produk ditemukan</p>
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
                    {product.isNew && (
                      <span className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 text-xs font-bold">NEW</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-black mb-2 line-clamp-2">
                    {product.productName}
                  </h3>
                  <p className="font-bold text-blue-600">Rp {product.price?.toLocaleString('id-ID')}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {product.stockQuantity > 0 ? `Stok: ${product.stockQuantity}` : 'Habis'}
                  </p>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-4 py-2 border rounded ${
                      page === p ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded disabled:opacity-50"
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

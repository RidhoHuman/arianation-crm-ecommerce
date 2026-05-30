import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import Breadcrumb from '../components/Breadcrumb';
import OptimizedImage from '../components/OptimizedImage';
import useCartStore from '../store/cartStore';
import api from '../services/api';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.data || res.data);
        setLoading(false);
      } catch (e) {
        setError(e?.response?.data?.message || 'Produk tidak ditemukan');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-16 p-6">
        <p className="text-center">Loading...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto mt-16 p-6 bg-red-50 rounded border border-red-200">
        <h2 className="text-lg font-semibold text-red-700">{error || 'Produk tidak ditemukan'}</h2>
        <button onClick={() => navigate('/products')} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
          Kembali ke Produk
        </button>
      </div>
    );
  }

  const productStructuredData = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.productName,
    description: product.description,
    image: product.imageUrl || 'https://arianation.com/placeholder.png',
    brand: {
      '@type': 'Brand',
      name: 'Arianation',
    },
    offers: {
      '@type': 'Offer',
      url: `https://arianation.com/products/${product.id}`,
      priceCurrency: 'IDR',
      price: product.price,
      availability: product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      ratingCount: product.ratingCount || 0,
    } : undefined,
  };

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.productName,
      price: product.price,
      quantity,
      image: product.imageUrl,
    });
    alert(`${quantity} item ditambahkan ke keranjang`);
  };

  return (
    <>
      <SEOHead
        title={product.productName}
        description={product.description || `Beli ${product.productName} di Arianation. Kualitas terbaik dengan harga terjangkau.`}
        image={product.imageUrl || 'https://arianation.com/placeholder.png'}
        url={`https://arianation.com/products/${product.id}`}
        type="product"
        structuredData={productStructuredData}
      />

      <Breadcrumb />

      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded">
        <button onClick={() => navigate('/products')} className="text-blue-600 mb-4">
          ← Kembali ke Produk
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="bg-gray-100 rounded p-4">
            <OptimizedImage
              publicId={product.imageUrl}
              alt={product.productName}
              width={400}
              height={400}
              className="w-full h-auto rounded"
              loading="eager"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Product Info Section */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.productName}</h1>
            <p className="text-gray-600 mb-4">{product.description}</p>

            <div className="mb-6">
              <p className="text-2xl font-bold text-blue-600">Rp {product.price?.toLocaleString('id-ID')}</p>
              <p className="text-sm text-gray-600 mt-2">
                Stok: <span className={product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}>
                  {product.stockQuantity > 0 ? `${product.stockQuantity} tersedia` : 'Habis'}
                </span>
              </p>
            </div>

            {product.category && (
              <p className="text-sm mb-4">
                Kategori: <span className="font-medium">{product.category.categoryName}</span>
              </p>
            )}

            {product.businessType && (
              <p className="text-sm mb-4">
                Tipe: <span className="font-medium">{product.businessType}</span>
              </p>
            )}

            {product.stockQuantity > 0 && (
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-4">
                  <label className="font-medium">Jumlah:</label>
                  <div className="flex items-center border rounded">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2">−</button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 text-center border-l border-r"
                    />
                    <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2">+</button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700"
                >
                  Tambah ke Keranjang
                </button>
              </div>
            )}

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-green-600 text-white py-3 rounded font-semibold hover:bg-green-700"
            >
              Checkout Sekarang
            </button>
          </div>
        </div>

        {/* Additional Info */}
        {product.variants && product.variants.length > 0 && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-bold mb-4">Pilihan Varian</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.variants.map((variant) => (
                <div key={variant.id} className="border rounded p-3 text-sm">
                  <p className="font-medium">{variant.variantName}</p>
                  <p className="text-gray-600">+Rp {variant.additionalPrice?.toLocaleString('id-ID') || '0'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

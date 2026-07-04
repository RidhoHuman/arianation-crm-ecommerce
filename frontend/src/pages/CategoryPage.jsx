import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import Breadcrumb from '../components/Breadcrumb';
import OptimizedImage from '../components/OptimizedImage';
import api from '../services/api';

const CATEGORY_INFO = {
  everyday: {
    name: 'Everyday Collection',
    icon: '👕',
    description: 'Versatile pieces untuk aktivitas sehari-hari. Dari berangkat kerja, nonton bola, hang out, sampai casual weekend.',
    longDescription: 'Everyday Collection adalah inti dari filosofi Arianation: ONE PIECE, MULTIPLE USES. Setiap piece dirancang untuk bisa dipakai di berbagai situasi - dari meeting santai, nonton bola bareng teman, sampai weekend hang out. Kualitas premium dengan desain yang timeless.',
    purpose: 'Koleksi ini dirancang untuk kamu yang ingin tampil fleksibel setiap hari tanpa berganti banyak pakaian. Satu outfit bisa dipakai di kantor, cafe, dan jalan-jalan sore.',
    highlights: [
      'Desain minimalis dengan sentuhan streetwear',
      'Material nyaman untuk aktivitas sepanjang hari',
      'Cut yang mudah dipadupadankan',
    ],
    useCases: ['Meeting santai', 'Nonton bola', 'Hangout', 'Weekend trip'],
    image: 'https://arianation.com/og-everyday.png',
  },
  work: {
    name: 'Work Collection',
    icon: '💼',
    description: 'Professional yet cool pieces. Bukan formal boring, tapi stylish dan respect untuk lingkungan kerja.',
    longDescription: 'Work Collection menghadirkan pendekatan baru untuk workwear: professional tapi tidak membosankan, stylish tapi tetap respect untuk lingkungan kerja. Setiap piece dirancang untuk membuat kamu look sharp di kantor tanpa mengorbankan comfort dan personal style.',
    purpose: 'Koleksi ini membangun citra profesional yang tetap relevan dalam gaya sehari-hari. Cocok untuk kamu yang ingin terlihat sophisticated tanpa kehilangan karakter.',
    highlights: [
      'Potongan modern dengan detail rapi',
      'Warna earth tone dan netral yang mudah dipadupadankan',
      'Material lembut namun tetap structured',
    ],
    useCases: ['Meeting bisnis', 'Co-working', 'Client presentation', 'Afterwork hangout'],
    image: 'https://arianation.com/og-work.png',
  },
  adventure: {
    name: 'Adventure Collection',
    icon: '🏔️',
    description: 'Outdoor-ready pieces untuk naik gunung, hiking, padel, atau aktivitas adventure. Functional dan stylish!',
    longDescription: 'Adventure Collection dibuat untuk kamu yang aktif di luar ruangan. Dari naik gunung, hiking, padel, sampai outdoor concert. Functional materials yang breathable dan durable, dengan desain yang tetap stylish bahkan di kondisi paling extreme.',
    purpose: 'Koleksi ini siap menemani aktivitas di alam terbuka, tetap ringan, fungsional, dan tahan cuaca. Ideal untuk petualang urban yang suka menggabungkan fungsi dengan gaya.',
    highlights: [
      'Material breathable dan cepat kering',
      'Detail fungsional seperti saku cerdas dan tali adjustable',
      'Warna gelap yang tetap mudah dibersihkan',
    ],
    useCases: ['Hiking', 'Camping', 'Travel', 'Outdoor sport'],
    image: 'https://arianation.com/og-adventure.png',
  },
  stories: {
    name: 'Stories Collection',
    icon: '📖',
    description: 'Limited edition yang celebrate authentic Indonesian culture, local artists, dan regional tribes.',
    longDescription: 'Stories Collection adalah limited edition drops yang celebrate authentic Indonesian culture. Setiap piece punya cerita - dari local artists collaborations, regional tribes inspirations, sampai supporter culture heritage. Limited quantity, meaningful stories.',
    purpose: 'Setiap produk koleksi ini membawa cerita kuat. Dari dukungan regional, seni lokal, hingga kenangan supporter culture; kamu tidak hanya membeli outfit, tetapi warisan cerita.',
    highlights: [
      'Kolaborasi dengan lokal artist dan komunitas',
      'Motif dan detail terinspirasi budaya Indonesia',
      'Limited drops untuk kolektor dan penggemar',
    ],
    useCases: ['Limited drop', 'Gift spesial', 'Event komunitas', 'Streetwear statement'],
    image: 'https://arianation.com/og-stories.png',
  },
};

export default function CategoryPage() {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const category = CATEGORY_INFO[slug];

  useEffect(() => {
    const fetchProducts = async () => {
      if (!category) return;
      
      try {
        setLoading(true);
        const res = await api.get(`/products?category=${slug}&limit=20`);
        setProducts(res.data.data || res.data);
        setLoading(false);
      } catch (e) {
        setError(e?.response?.data?.message || 'Gagal mengambil produk');
        setLoading(false);
      }
    };

    fetchProducts();
  }, [slug, category]);

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto mt-16 p-6 bg-red-50 rounded border border-red-200">
        <h2 className="text-lg font-semibold text-red-700">Category tidak ditemukan</h2>
        <Link to="/products" className="mt-4 inline-block text-blue-600 hover:underline">
          Kembali ke semua produk
        </Link>
      </div>
    );
  }

  const categoryStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description,
    url: `https://arianation.com/categories/${slug}`,
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
        title={category.name}
        description={category.description}
        image={category.image}
        url={`https://arianation.com/categories/${slug}`}
        type="website"
        structuredData={categoryStructuredData}
      />

      <Breadcrumb />

      {/* Hero Section */}
      <div className="bg-aria-charcoal text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">{category.icon}</span>
            <h1 className="text-4xl md:text-5xl font-bold">{category.name}</h1>
          </div>
          <p className="text-xl md:text-2xl text-aria-cream font-light max-w-3xl">
            {category.description}
          </p>
          <p className="mt-8 max-w-3xl text-sm text-aria-cream/80 leading-relaxed">
            Dari Malang, kami merancang setiap koleksi untuk kegunaan sehari-hari dan kesempatan spesial. Arianation adalah lifestyle brand yang hadir untuk segala sisi perjalananmu.
          </p>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 mt-8 rounded-full border border-white bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Pelajari cerita brand →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Category Description */}
        <div className="mb-12">
          <p className="text-lg text-gray-700 leading-relaxed max-w-4xl">
            {category.longDescription}
          </p>
        </div>

        {/* Category Purpose & Highlights */}
        <div className="grid gap-8 lg:grid-cols-2 mb-12">
          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-8">
            <h2 className="text-2xl font-bold mb-4 text-aria-charcoal">Mengapa koleksi ini ada</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              {category.purpose}
            </p>
            <div className="space-y-3">
              {category.highlights.map((highlight) => (
                <div key={highlight} className="flex gap-3 items-start">
                  <span className="mt-1 text-aria-maroon">•</span>
                  <p className="text-gray-700 leading-relaxed">{highlight}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8">
            <h2 className="text-2xl font-bold mb-4 text-aria-charcoal">Cocok untuk momen</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {category.useCases.map((useCase) => (
                <div key={useCase} className="rounded-2xl bg-aria-cream p-4">
                  <p className="text-sm text-gray-700">{useCase}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-12 rounded-3xl border border-gray-200 bg-slate-50 p-8">
          <h2 className="text-2xl font-bold mb-4 text-aria-charcoal">Karakter Arianation di koleksi ini</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold mb-2">Lifestyle-first</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Kami mendesain setiap piece untuk mendukung gaya hidup Indonesia yang aktif, kreatif, dan penuh cerita. Bukan sekadar fashion, tetapi identitas personal.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold mb-2">Local roots</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Arianation lahir dari Malang dan mendengarkan komunitas supporter, pekerja, dan petualang lokal. Koleksi ini merayakan akar Indonesia dalam setiap detail.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold mb-2">Versatile utility</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Satu item dapat bekerja di banyak konteks. Work, adventure, everyday, dan stories: semua bisa ditransformasikan hanya dengan styling yang tepat.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold mb-2">Authentic story</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Koleksi Stories khusus dirancang untuk mereka yang mencari lebih dari sekadar pakaian: produk dengan narasi budaya, kolaborasi, dan heritage supporter.
              </p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <p className="text-center py-12">Loading produk...</p>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">Belum ada produk di kategori ini</p>
            <Link to="/products" className="text-aria-maroon font-medium hover:underline">
              Lihat semua produk
            </Link>
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
                </Link>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-12 pt-12 border-t">
              <h3 className="text-2xl font-bold mb-4 text-aria-charcoal">
                Lihat Semua Koleksi
              </h3>
              <p className="text-gray-600 mb-6">
                Explore semua kategori Arianation untuk find your perfect piece
              </p>
              <Link
                to="/products"
                className="inline-block bg-aria-charcoal text-white px-8 py-3 rounded-lg font-semibold hover:bg-aria-maroon transition"
              >
                Semua Produk →
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
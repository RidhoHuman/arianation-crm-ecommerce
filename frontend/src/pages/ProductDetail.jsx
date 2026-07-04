import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiHeart, FiMinus, FiPlus, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import SEOHead from '../components/SEOHead';
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
  const [selectedSize, setSelectedSize] = useState('');

  // Gallery state
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  // Accordion state
  const [openAccordion, setOpenAccordion] = useState('details'); // 'details', 'size', 'shipping'

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.data || res.data);
      } catch (e) {
        setError(e?.response?.data?.message || 'Produk tidak ditemukan');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const allImages = useMemo(() => {
    if (!product) return [];
    let urls = [];
    if (product.imageUrls) {
      try {
        urls = typeof product.imageUrls === 'string' ? JSON.parse(product.imageUrls) : product.imageUrls;
      } catch (e) { }
    }

    let finalImages = [product.imageUrl];
    if (product.colors && Array.isArray(product.colors)) {
      product.colors.forEach(c => {
        if (c.imageUrl) finalImages.push(c.imageUrl);
      });
    }
    finalImages = [...finalImages, ...(Array.isArray(urls) ? urls : [])].filter(Boolean);
    return [...new Set(finalImages)];
  }, [product]);

  const nextImage = () => {
    setCurrentImageIdx((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIdx((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white px-4">
        <p className="text-sm font-medium text-gray-500 tracking-widest uppercase mb-4">{error || 'Produk tidak ditemukan'}</p>
        <button
          onClick={() => navigate('/products')}
          className="border border-black px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Silakan pilih ukuran terlebih dahulu.');
      return;
    }
    addItem({
      id: product.id,
      name: product.productName,
      price: product.price,
      quantity,
      image: allImages[currentImageIdx] || product.imageUrl,
      size: selectedSize
    });

    const btn = document.getElementById('add-to-bag-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'ADDED ✓';
    setTimeout(() => {
      btn.innerHTML = originalText;
    }, 2000);
  };

  // Helper to safely split description into intro and bullets if they exist
  const rawDesc = product.description || '';
  const descParts = rawDesc.split('\n').filter(p => p.trim() !== '');

  return (
    <div className="w-full bg-white min-h-screen pt-[100px] pb-20 font-sans text-gray-900">
      <SEOHead
        title={`${product.productName} | Arianation`}
        description={product.description}
        image={product.imageUrl}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb minimalist (opsional, jika ingin ditampilkan) */}
        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-8 flex gap-2">
          <span className="hover:text-black cursor-pointer" onClick={() => navigate('/')}>Home</span>
          <span>›</span>
          <span className="hover:text-black cursor-pointer" onClick={() => navigate('/products')}>Produk</span>
          <span>›</span>
          <span className="text-black">{product.productName}</span>
        </div>

        <div className="flex flex-col md:flex-row gap-10 lg:gap-16">

          {/* Left Column: Image Gallery */}
          <div className="w-full md:w-3/5 flex flex-col">
            {/* Main Image Slider */}
            <div className="relative w-full aspect-[4/5] md:aspect-square bg-[#F7F7F7] overflow-hidden group mb-4">
              <img
                src={allImages[currentImageIdx]}
                alt={product.productName}
                className="w-full h-full object-contain mix-blend-multiply"
              />

              {/* Desktop Hover Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <FiChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <FiChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Dots Pagination */}
              {allImages.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIdx(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${currentImageIdx === idx ? 'bg-black w-4' : 'bg-gray-300'}`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIdx(idx)}
                    className={`relative w-20 h-24 shrink-0 overflow-hidden border transition-colors ${currentImageIdx === idx ? 'border-black' : 'border-transparent hover:border-gray-200'}`}
                  >
                    <div className="w-full h-full bg-[#F7F7F7] flex items-center justify-center">
                      <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Details */}
          <div className="w-full md:w-2/5 flex flex-col pt-2">
            <h1 className="text-2xl lg:text-3xl font-medium tracking-tight uppercase text-black mb-4 leading-snug">
              {product.productName}
            </h1>

            <div className="text-base text-gray-700 mb-8">
              Rp {product.price?.toLocaleString('id-ID')}
            </div>

            {/* Size Selector */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">SIZE:</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-black">{selectedSize || 'SELECT SIZE'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-10 flex items-center justify-center text-xs border transition-colors ${selectedSize === size
                      ? 'border-black text-black'
                      : 'border-gray-200 text-gray-600 hover:border-black'
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
                QUANTITY
              </div>
              <div className="flex items-center border border-gray-200 w-32 h-10">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-black transition-colors"
                >
                  <FiMinus size={14} />
                </button>
                <div className="flex-1 h-full flex items-center justify-center text-sm">
                  {quantity}
                </div>
                <button
                  onClick={() => setQuantity(Math.min(product.stockQuantity || 10, quantity + 1))}
                  className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-black transition-colors"
                >
                  <FiPlus size={14} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-12">
              <button
                id="add-to-bag-btn"
                onClick={handleAddToCart}
                disabled={product.stockQuantity <= 0}
                className="flex-1 bg-[#1A1A1A] text-white h-12 flex items-center justify-center text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-colors disabled:opacity-50"
              >
                {product.stockQuantity > 0 ? 'ADD TO BAG' : 'OUT OF STOCK'}
              </button>
              <button
                className="w-12 h-12 border border-gray-200 flex items-center justify-center text-gray-600 hover:border-black hover:text-black transition-colors"
                aria-label="Add to Wishlist"
              >
                <FiHeart size={18} />
              </button>
            </div>

            {/* Accordions */}
            <div className="border-t border-gray-200 divide-y divide-gray-200">

              {/* Product Details */}
              <div className="py-4">
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'details' ? '' : 'details')}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest text-black">PRODUCT DETAILS</span>
                  <span className="text-gray-400 group-hover:text-black transition-colors">
                    {openAccordion === 'details' ? <FiMinus size={14} /> : <FiPlus size={14} />}
                  </span>
                </button>

                {openAccordion === 'details' && (
                  <div className="mt-4 text-[11px] leading-relaxed text-gray-600 pr-4 space-y-3">
                    <p>{descParts[0] || product.description}</p>
                    {descParts.length > 1 && (
                      <ul className="list-disc pl-4 space-y-1">
                        {descParts.slice(1).map((part, i) => (
                          <li key={i}>{part.replace(/^[-\*]\s*/, '')}</li>
                        ))}
                      </ul>
                    )}
                    {(product.versatile_uses || '').includes('Regular fit') && (
                      <ul className="list-disc pl-4 space-y-1 mt-3">
                        <li>Regular fit</li>
                        <li>Premium fabric blend</li>
                        <li>Arianation signature tag at hem</li>
                        <li>Imported / Designed in Malang</li>
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Size Guide */}
              <div className="py-4">
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'size' ? '' : 'size')}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest text-black">SIZE GUIDE</span>
                  <span className="text-gray-400 group-hover:text-black transition-colors">
                    {openAccordion === 'size' ? <FiMinus size={14} /> : <FiPlus size={14} />}
                  </span>
                </button>
                {openAccordion === 'size' && (
                  <div className="mt-4 text-[11px] leading-relaxed text-gray-600">
                    <p>Measurements are provided by the brand. Please check the fit before purchasing.</p>
                  </div>
                )}
              </div>

              {/* Shipping & Returns */}
              <div className="py-4">
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'shipping' ? '' : 'shipping')}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest text-black">SHIPPING & RETURNS</span>
                  <span className="text-gray-400 group-hover:text-black transition-colors">
                    {openAccordion === 'shipping' ? <FiMinus size={14} /> : <FiPlus size={14} />}
                  </span>
                </button>
                {openAccordion === 'shipping' && (
                  <div className="mt-4 text-[11px] leading-relaxed text-gray-600">
                    <p>Free standard shipping on all orders above Rp 500.000. Returns accepted within 7 days of delivery.</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import OptimizedImage from './OptimizedImage';
import useUIStore from '../store/uiStore';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const HeartIcon = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={filled ? 'text-aria-maroon' : 'text-gray-500 hover:text-aria-maroon'}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

export default function ProductCard({ 
  product, 
  aspectRatio = 'aspect-square',
  showBadges = true,
  showCategory = true,
  wishlistIds = new Set(),
  onToggleWishlist = null 
}) {
  const { t } = useTranslation('translation', { keyPrefix: 'productCard' });
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const navigate = useNavigate();

  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  // Extract all images
  const allImages = useMemo(() => {
    let urls = [];
    if (product.imageUrls) {
      try {
        urls = typeof product.imageUrls === 'string' ? JSON.parse(product.imageUrls) : product.imageUrls;
        if (!Array.isArray(urls)) urls = [];
      } catch (e) {}
    }
    
    // Add primary image if not in urls
    let finalImages = [];
    if (product.imageUrl) finalImages.push(product.imageUrl);
    
    // Add colors' primary images
    if (product.colors && Array.isArray(product.colors)) {
      product.colors.forEach(c => {
        if (c.imageUrl) finalImages.push(c.imageUrl);
      });
    }

    finalImages = [...finalImages, ...urls].filter(Boolean);
    return [...new Set(finalImages)]; // Unique
  }, [product.imageUrl, product.imageUrls, product.colors]);



  const handleMouseMove = (e) => {
    if (allImages.length <= 1) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    const segmentWidth = width / allImages.length;
    const index = Math.max(0, Math.min(Math.floor(x / segmentWidth), allImages.length - 1));
    setCurrentImageIdx(index);
  };

  const handleMouseLeave = () => {
    if (allImages.length <= 1) return;
    setCurrentImageIdx(0);
  };

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (onToggleWishlist) {
      onToggleWishlist(product.id);
    }
  };

  const currentImage = allImages.length > 0 ? allImages[currentImageIdx] : null;

  return (
    <Link to={`/products/${product.id}`} className="group flex flex-col h-full w-full">
      <div 
        className={`relative bg-gray-100 dark:bg-gray-900 mb-4 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all rounded-md overflow-hidden aspect-[4/5]`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {currentImage ? (
          <img
            src={currentImage}
            alt={product.productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-500">{t('noImage')}</span>
          </div>
        )}


        {/* Dots */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-20">
            {allImages.map((_, idx) => (
              <div 
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${currentImageIdx === idx ? 'bg-aria-charcoal dark:bg-white w-3' : 'bg-gray-400 dark:bg-gray-600'}`}
              />
            ))}
          </div>
        )}

        {/* Badges & Wishlist */}
        {(showBadges || onToggleWishlist) && (
          <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
            <div className="flex gap-2">
              {product.is_limited && showBadges && (
                <span className="bg-aria-maroon text-white px-2 py-1 text-xs font-bold rounded shadow-sm">
                  {t('limited')}
                </span>
              )}
              {product.isNew && showBadges && (
                <span className="bg-blue-600 text-white px-2 py-1 text-xs font-bold rounded shadow-sm">
                  {t('new')}
                </span>
              )}
            </div>
            
            {isAuthenticated && onToggleWishlist && (
              <button
                onClick={toggleWishlist}
                className="bg-white/80 backdrop-blur dark:bg-black/50 p-2 rounded-full shadow hover:bg-white dark:hover:bg-black transition-colors z-10"
              >
                <HeartIcon filled={wishlistIds.has(product.id)} />
              </button>
            )}
          </div>
        )}
      </div>
      <h3 className="text-sm md:text-base font-semibold text-aria-charcoal mb-1 line-clamp-2 leading-snug dark:text-gray-200 group-hover:text-aria-maroon dark:group-hover:text-white transition-colors">
        {product.productName}
      </h3>
      <div className="flex flex-col gap-1 mt-auto">
        <div className="text-aria-charcoal dark:text-gray-400 font-bold text-sm md:text-base">
          Rp {product.price?.toLocaleString('id-ID')}
        </div>
      </div>
      
      {showBadges && (
        <div className="mt-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase ${product.stockQuantity > 0 ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800' : 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800'}`}>
            {product.stockQuantity > 0 ? t('inStock') : t('soldOut')}
          </span>
        </div>
      )}

      {product.versatile_uses && showBadges && (
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
      
      {showCategory && product.category && (
        <div className="mt-2">
          <span className="text-xs bg-gray-100 dark:bg-gray-800 dark:text-gray-300 px-2 py-1 rounded">
            {product.category.categoryName || product.category}
          </span>
        </div>
      )}
    </Link>
  );
}

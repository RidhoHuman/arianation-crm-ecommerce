import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import useBannerStore from '../store/bannerStore';
import useUIStore from '../store/uiStore';

export default function HeroSlider({ location = 'home' }) {
  const { banners, fetchBanners, isLoading } = useBannerStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchBanners(location);
  }, [fetchBanners, location]);

  const activeBanners = banners.filter(b => b.isActive).sort((a, b) => a.orderIndex - b.orderIndex);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000); // Auto slide every 5 seconds
    
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const language = useUIStore((s) => s.language) || 'ID';
  const TRANSLATIONS = {
    ID: {
      heroTitle: 'Gaya Hidup untuk Setiap Momen',
      heroDesc: 'Pakaian jalanan premium yang dirancang untuk para pemberontak, pendukung, dan petualang. Dirancang dengan tujuan dan semangat.',
      discoverBtn: 'Belanja Sekarang',
      customSablonBtn: 'Sablon Kustom'
    },
    EN: {
      heroTitle: 'Lifestyle for Every Moment',
      heroDesc: 'Premium streetwear crafted for the rebels, the supporters, and the adventurers. Designed with purpose and passion.',
      discoverBtn: 'Shop Now',
      customSablonBtn: 'Custom Sablon'
    }
  };
  const t = TRANSLATIONS[language];

  if (isLoading) {
    return (
      <section className="relative h-screen min-h-[600px] w-full bg-aria-charcoal flex items-center justify-center overflow-hidden">
        <div className="w-12 h-12 border-4 border-aria-maroon border-t-transparent rounded-full animate-spin"></div>
      </section>
    );
  }

  if (activeBanners.length === 0) {
    // Fallback if no banners are set in admin
    return (
      <section className="relative h-screen min-h-[600px] bg-white text-white flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab" 
            alt="Default Banner" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6 mt-20">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">{t.heroTitle}</h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            {t.heroDesc}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
            <Link to="/products" className="bg-aria-maroon hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition-colors tracking-wider text-sm uppercase shadow-lg shadow-aria-maroon/20">
              {t.discoverBtn}
            </Link>
            <Link to="/custom-sablon" className="bg-transparent border border-white hover:bg-white hover:text-black text-white font-bold py-3 px-8 rounded-full transition-colors tracking-wider text-sm uppercase backdrop-blur-sm">
              {t.customSablonBtn}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const currentBanner = activeBanners[currentIndex];

  return (
    <section className="relative h-screen min-h-[600px] w-full bg-white text-white flex items-center justify-center overflow-hidden group">
      <AnimatePresence>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
        >
          <img 
            src={currentBanner.imageUrl} 
            alt={currentBanner.title || "Banner"} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 text-center max-w-4xl mx-auto px-6 mt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentIndex}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight drop-shadow-lg">
              {currentBanner.title || t.heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto drop-shadow-md">
              {currentBanner.subtitle || t.heroDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
              <Link 
                to={currentBanner.buttonLink || "/products"} 
                className="bg-aria-maroon hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition-colors tracking-wider text-sm uppercase shadow-lg shadow-aria-maroon/20"
              >
                {(!currentBanner.buttonText || currentBanner.buttonText.toUpperCase() === 'SHOP NOW' || currentBanner.buttonText.toUpperCase() === 'DISCOVER COLLECTION') ? t.discoverBtn : currentBanner.buttonText}
              </Link>
              <Link 
                to="/custom-sablon" 
                className="bg-transparent border border-white hover:bg-white hover:text-black text-white font-bold py-3 px-8 rounded-full transition-colors tracking-wider text-sm uppercase backdrop-blur-sm"
              >
                {t.customSablonBtn}
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Dots */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-center gap-3">
          {activeBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all duration-300 rounded-full ${
                currentIndex === idx 
                  ? 'w-10 h-1.5 bg-white' 
                  : 'w-2 h-1.5 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Optional: Navigation Arrows (show on hover on desktop) */}
      {activeBanners.length > 1 && (
        <>
          <button 
            onClick={() => setCurrentIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1))}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
          >
            &#10094;
          </button>
          <button 
            onClick={() => setCurrentIndex((prev) => (prev + 1) % activeBanners.length)}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
          >
            &#10095;
          </button>
        </>
      )}
    </section>
  );
}

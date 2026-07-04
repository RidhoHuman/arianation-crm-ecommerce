import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import useUIStore from '../store/uiStore';

const CATEGORIES = ['Semua', 'Pakaian', 'Tas & Merchandise', 'Packaging'];

export default function Portfolio() {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [isLoading, setIsLoading] = useState(true);
  const language = useUIStore(s => s.language) || 'ID';

  const t = {
    ID: {
      title: 'Galeri Portofolio',
      desc: 'Bukti nyata dari dedikasi kami terhadap kualitas. Jelajahi berbagai hasil sablon dan produksi merchandise yang pernah kami kerjakan.',
      empty: 'Belum ada portofolio di kategori ini.'
    },
    EN: {
      title: 'Portfolio Gallery',
      desc: 'Real proof of our dedication to quality. Explore various screen printing and merchandise production we have done.',
      empty: 'No portfolio items in this category yet.'
    }
  }[language];

  useEffect(() => {
    fetchPortfolio();
  }, [activeCategory]);

  const fetchPortfolio = async () => {
    setIsLoading(true);
    try {
      const url = activeCategory === 'Semua' 
        ? '/portfolio' 
        : `/portfolio?category=${encodeURIComponent(activeCategory)}`;
      const res = await api.get(url);
      if (res.data?.success) {
        setItems(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching portfolio', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-white dark:bg-black text-black dark:text-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6">{t.title}</h1>
          <p className="text-gray-500 text-sm leading-relaxed">{t.desc}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 text-xs font-bold uppercase tracking-widest border transition-all duration-300 ${
                activeCategory === cat 
                  ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' 
                  : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-black dark:border-gray-800 dark:border-t-white rounded-full animate-spin"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center text-gray-500 py-20">
              <p>{t.empty}</p>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    key={item.id}
                    className="group relative bg-gray-100 dark:bg-gray-900 overflow-hidden cursor-pointer"
                  >
                    <div className="aspect-[4/5] overflow-hidden">
                      <img 
                        src={item.imageUrl || item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <span className="inline-block px-2 py-1 bg-white text-black text-[10px] font-bold uppercase tracking-widest mb-3">
                          {item.category}
                        </span>
                        <h3 className="text-white text-lg font-bold uppercase tracking-wide leading-tight">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-gray-300 text-xs mt-2 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}

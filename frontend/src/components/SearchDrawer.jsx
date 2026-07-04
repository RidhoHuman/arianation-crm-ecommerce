import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSearch, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function SearchDrawer({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle Debounced Search
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setTotal(0);
        return;
      }

      setIsLoading(true);
      try {
        const { data } = await api.get(`/products?search=${encodeURIComponent(query.trim())}&limit=6&businessType=FASHION_RETAIL`);
        setResults(data.data || []);
        setTotal(data.pagination?.total || 0);
      } catch (error) {
        console.error('Error searching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300); // 300ms debounce
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleResultClick = (id) => {
    onClose();
    navigate(`/products/${encodeURIComponent(id)}`);
  };

  const handleViewAll = () => {
    if (query.trim()) {
      onClose();
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleViewAll();
    }
  };

  // Format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />

          {/* Drawer (Right Side) */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[450px] md:w-[500px] bg-white dark:bg-aria-charcoal shadow-2xl z-[9999] flex flex-col"
          >
            {/* Header / Search Input */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold tracking-widest uppercase text-aria-charcoal dark:text-white">Pencarian</h2>
                <button 
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors bg-gray-100 dark:bg-gray-800 rounded-full"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ketik nama produk..."
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-aria-maroon dark:focus:border-white rounded-xl outline-none text-lg text-black dark:text-white transition-all"
                />
                {query && (
                  <button 
                    onClick={() => setQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                  >
                    <FiX />
                  </button>
                )}
              </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-black/20">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-4">
                  <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-aria-maroon rounded-full animate-spin" />
                  <p className="text-sm text-gray-500 font-medium animate-pulse">Mencari produk...</p>
                </div>
              ) : query.trim() && results.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiSearch className="text-2xl text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Tidak ditemukan</h3>
                  <p className="text-sm text-gray-500">Kami tidak menemukan produk untuk "{query}"</p>
                </div>
              ) : results.length > 0 ? (
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Hasil Pencarian ({total})
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {results.map((product) => (
                      <div 
                        key={product.id}
                        onClick={() => handleResultClick(product.id)}
                        className="group cursor-pointer bg-white dark:bg-aria-charcoal rounded-xl overflow-hidden border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="aspect-[4/5] bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.productName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              No Image
                            </div>
                          )}
                          {product.isSale && (
                            <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">
                              SALE
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-aria-maroon transition-colors">
                            {product.productName}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 opacity-50">
                  <FiSearch className="text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">Ketik sesuatu untuk mulai mencari</p>
                </div>
              )}
            </div>

            {/* Footer / View All */}
            {total > results.length && (
              <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-aria-charcoal">
                <button 
                  onClick={handleViewAll}
                  className="w-full py-4 bg-aria-charcoal dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm tracking-widest hover:bg-aria-maroon dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  LIHAT SEMUA ({total}) <FiArrowRight />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useCartStore from '../store/cartStore';
import SEOHead from '../components/SEOHead';
import OptimizedImage from '../components/OptimizedImage';
import Breadcrumb from '../components/Breadcrumb';

import useUIStore from '../store/uiStore';

export default function Cart() {
  const { items, updateQuantity, removeItem, getTotal } = useCartStore();
  const navigate = useNavigate();
  const language = useUIStore((s) => s.language) || 'ID';

  const handleQuantityChange = (id, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty > 0) {
      updateQuantity(id, newQty);
    }
  };

  return (
    <>
      <SEOHead 
        title={language === 'EN' ? "Bag - Arianation" : "Keranjang - Arianation"} 
        description={language === 'EN' ? "Your shopping bag at Arianation." : "Keranjang belanja Anda di Arianation."} 
      />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 mt-6 mb-24">
        <Breadcrumb />
        
        <h1 className="text-4xl font-display font-medium uppercase tracking-tight text-aria-charcoal dark:text-white mb-10 mt-6">
          {language === 'EN' ? 'Your Bag' : 'Keranjang Anda'}
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-24 bg-gray-50/50 dark:bg-gray-900/50">
            <h2 className="text-xl font-medium tracking-widest uppercase mb-4 text-gray-500 dark:text-gray-400">
              {language === 'EN' ? 'Your bag is empty' : 'Keranjang Anda kosong'}
            </h2>
            <Link 
              to="/products" 
              className="inline-block border border-aria-charcoal dark:border-white px-8 py-4 text-sm font-medium uppercase tracking-[0.15em] hover:bg-aria-charcoal dark:hover:bg-white hover:text-white dark:hover:text-black text-aria-charcoal dark:text-white transition-colors"
            >
              {language === 'EN' ? 'Continue Shopping' : 'Lanjutkan Belanja'}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Bag Items */}
            <div className="lg:w-2/3">
              <div className="border-t border-black dark:border-white">
                <div className="hidden md:grid grid-cols-12 gap-4 py-4 border-b border-gray-200 dark:border-gray-800 text-xs font-semibold tracking-widest uppercase text-gray-500 dark:text-gray-400">
                  <div className="col-span-6">{language === 'EN' ? 'Product' : 'Produk'}</div>
                  <div className="col-span-2 text-center">{language === 'EN' ? 'Price' : 'Harga'}</div>
                  <div className="col-span-2 text-center">{language === 'EN' ? 'Quantity' : 'Jumlah'}</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {items.map((item, index) => (
                    <motion.div 
                      key={item.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="py-6 md:grid md:grid-cols-12 md:gap-4 md:items-center flex flex-col gap-6"
                    >
                      {/* Product Info */}
                      <div className="md:col-span-6 flex gap-6">
                        <div className="w-24 h-32 bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                          {item.imageUrl ? (
                            <OptimizedImage
                              publicId={item.imageUrl}
                              alt={item.productName}
                              className="w-full h-full object-cover grayscale-[20%]"
                              width={96}
                              height={128}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs uppercase tracking-widest">
                              {language === 'EN' ? 'No img' : 'Tanpa gbr'}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center">
                          <Link to={`/products/${item.originalId || item.id}`} className="font-medium text-aria-charcoal dark:text-white hover:text-aria-maroon transition-colors uppercase tracking-wider text-sm mb-2">
                            {item.productName}
                          </Link>
                          {item.color && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">{language === 'EN' ? 'Color' : 'Warna'}: {item.color}</p>
                          )}
                          {item.size && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{language === 'EN' ? 'Size' : 'Ukuran'}: {item.size}</p>
                          )}
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 uppercase tracking-widest text-left w-fit transition-colors underline underline-offset-4"
                          >
                            {language === 'EN' ? 'Remove' : 'Hapus'}
                          </button>
                        </div>
                      </div>

                      {/* Price (Desktop) */}
                      <div className="hidden md:block md:col-span-2 text-center text-sm dark:text-gray-300">
                        Rp {item.price?.toLocaleString('id-ID')}
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-2 flex justify-between md:justify-center items-center">
                        <span className="md:hidden text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                          {language === 'EN' ? 'Qty:' : 'Jml:'}
                        </span>
                        <div className="flex items-center border border-gray-300 dark:border-gray-700 w-24">
                          <button 
                            onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                            className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            −
                          </button>
                          <span className="w-full text-center text-sm font-medium dark:text-white">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                            className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="md:col-span-2 flex justify-between md:justify-end text-sm font-medium text-aria-charcoal dark:text-white">
                        <span className="md:hidden text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">Total:</span>
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:w-1/3">
              <div className="bg-neutral-50 dark:bg-aria-charcoal p-8 sticky top-24 border border-neutral-200 dark:border-neutral-800">
                <h2 className="text-sm font-semibold tracking-widest uppercase mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800 dark:text-white">
                  {language === 'EN' ? 'Order Summary' : 'Ringkasan Pesanan'}
                </h2>
                
                <div className="flex justify-between mb-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Subtotal ({items.reduce((acc, i) => acc + i.quantity, 0)} {language === 'EN' ? 'items' : 'item'})</span>
                  <span className="font-medium text-gray-900 dark:text-white">Rp {getTotal().toLocaleString('id-ID')}</span>
                </div>
                
                <div className="flex justify-between mb-6 pb-6 border-b border-gray-200 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400">
                  <span>{language === 'EN' ? 'Shipping' : 'Pengiriman'}</span>
                  <span>{language === 'EN' ? 'Calculated at checkout' : 'Dihitung saat checkout'}</span>
                </div>
                
                <div className="flex justify-between mb-8 dark:text-white">
                  <span className="font-semibold uppercase tracking-widest">Total</span>
                  <span className="font-medium text-lg text-aria-charcoal dark:text-white">Rp {getTotal().toLocaleString('id-ID')}</span>
                </div>
                

                
                <button 
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-aria-charcoal dark:bg-white text-white dark:text-black py-4 text-sm uppercase tracking-[0.2em] font-medium hover:bg-aria-maroon transition-colors active:scale-[0.98]"
                >
                  Checkout
                </button>
                
                <Link 
                  to="/products"
                  className="block text-center w-full mt-6 text-gray-500 dark:text-gray-400 hover:text-aria-charcoal dark:hover:text-white transition-colors text-xs uppercase tracking-widest underline underline-offset-4"
                >
                  {language === 'EN' ? 'Continue Shopping' : 'Lanjutkan Belanja'}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

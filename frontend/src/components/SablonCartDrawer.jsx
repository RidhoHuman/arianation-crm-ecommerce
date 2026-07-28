import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, X, Trash2, ArrowRight } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function SablonCartDrawer({ isOpen, onClose, onCheckoutSuccess, onDraftsChange }) {
  const { t } = useTranslation();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchDrafts();
    }
  }, [isOpen, isAuthenticated]);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/orders/custom-sablon/draft');
      setDrafts(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch sablon drafts:', err);
      setError('Gagal memuat keranjang sablon');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      setError('');
      await api.delete(`/orders/custom-sablon/draft/${id}`);
      const newDrafts = drafts.filter(d => d.id !== id);
      setDrafts(newDrafts);
      if (onDraftsChange) onDraftsChange(newDrafts.length);
    } catch (err) {
      console.error('Failed to delete draft:', err);
      setError('Gagal menghapus draft');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (drafts.length === 0) return;
    try {
      setCheckoutLoading(true);
      setError('');
      const draftIds = drafts.map(d => d.id);
      
      const res = await api.post('/orders/custom-sablon/checkout-drafts', { draftIds });
      
      // Clear local drafts
      setDrafts([]);
      
      // Call success callback with payment url or redirect
      if (onCheckoutSuccess) {
        onCheckoutSuccess(res.data.data);
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      setError(err.response?.data?.message || 'Gagal memproses pesanan sablon');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const totalAmount = drafts.reduce((sum, draft) => sum + parseFloat(draft.estimatedPrice || 0), 0);
  const downPaymentAmount = Math.ceil(totalAmount * 0.3);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 h-screen w-full sm:w-[450px] bg-white dark:bg-[#111111] z-[101] shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-aria-charcoal dark:text-white" />
                <h2 className="text-lg font-display font-medium uppercase tracking-widest text-aria-charcoal dark:text-white">
                  Keranjang Sablon
                </h2>
                <span className="bg-aria-charcoal dark:bg-white text-white dark:text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {drafts.length}
                </span>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
                </div>
              ) : drafts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm uppercase tracking-widest">Keranjang masih kosong</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {drafts.map((draft) => (
                    <div key={draft.id} className="flex gap-4 p-4 border border-gray-200 dark:border-gray-800 group">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-black/50 border border-gray-100 dark:border-gray-800 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                        {draft.mockupPreviewUrl ? (
                          <img src={draft.mockupPreviewUrl} alt="Mockup" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-gray-400">No Image</span>
                        )}
                        <div className="absolute top-1 left-1 bg-black/70 text-white text-[8px] px-1 py-0.5 uppercase tracking-wider">
                          Draf
                        </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="text-sm font-bold text-aria-charcoal dark:text-white line-clamp-1 pr-2">
                              {draft.productTypeForSablon || 'Custom Product'}
                            </h3>
                            <button 
                              onClick={() => handleDelete(draft.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Hapus dari keranjang"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1 space-y-1">
                            <p className="font-semibold">{draft.colorPreferences || '-'} | Qty: {draft.quantity}</p>
                            <p>{draft.printTechnique || '-'} ({draft.numberOfColors || 1} Warna) - {draft.printPosition || '-'}</p>
                            {draft.designTitle && <p className="italic">"{draft.designTitle}"</p>}
                            <p className="text-sm font-black mt-2 text-black dark:text-white">
                              Rp {parseFloat(draft.estimatedPrice || 0).toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer / Checkout */}
            {drafts.length > 0 && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111111] sticky bottom-0 z-10">
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between items-center text-sm font-bold text-aria-charcoal dark:text-white uppercase tracking-widest">
                    <span>Total Keseluruhan</span>
                    <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 italic">*(Hanya estimasi, belum termasuk ongkir)</p>
                </div>
                
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full flex items-center justify-center gap-2 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-gray-200 text-white dark:text-black p-4 text-sm font-bold uppercase tracking-[0.15em] transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {checkoutLoading ? 'Memproses...' : 'Kirim Pengajuan Desain'}
                  {!checkoutLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </button>
                <p className="text-[10px] text-center text-gray-400 mt-4 uppercase tracking-widest">
                  Pengajuan akan dikirim ke Admin untuk ditinjau tanpa tagihan di awal.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

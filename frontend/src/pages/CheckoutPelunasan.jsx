import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';
import api from '../services/api';
import { toast } from 'react-toastify';
import SEOHead from '../components/SEOHead';
import Breadcrumb from '../components/Breadcrumb';

export default function CheckoutPelunasan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { setLoading } = useUIStore();
  
  const [order, setOrder] = useState(null);
  const [orderError, setOrderError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders/${id}`);
        const orderData = res.data?.data;
        if (!orderData) throw new Error('Order not found');
        
        if (orderData.status !== 'WAITING_FINAL_PAYMENT') {
           navigate(`/order-tracking/${id}`);
           return;
        }
        
        setOrder(orderData);
      } catch (err) {
        setOrderError(err.response?.data?.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchOrderDetails();
  }, [id, navigate, setLoading]);

  const processPayment = async () => {
    setOrderError(null);
    try {
      setLoading(true);
      const res = await api.post(`/orders/${id}/pelunasan`, {});
      
      const paymentUrl = res.data?.data?.paymentUrl;
      const skipped = res.data?.data?.skipped;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else if (skipped) {
        toast.success(res.data?.message || 'Pesanan siap diambil!');
        navigate(`/order-tracking/${id}`);
      } else {
        navigate(`/order-tracking/${id}`);
      }
      
    } catch (err) {
      setOrderError(err.response?.data?.message || 'Gagal membuat tagihan pelunasan.');
    } finally {
      setLoading(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  if (orderError && !order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-medium tracking-widest uppercase mb-4 text-red-500">Error</h2>
        <p className="text-sm text-gray-500">{orderError}</p>
        <button onClick={() => navigate('/account')} className="mt-6 border border-aria-charcoal px-8 py-4 text-sm font-medium uppercase tracking-[0.15em] hover:bg-aria-charcoal hover:text-white transition-colors">
          Back to Account
        </button>
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Checkout Pelunasan - Arianation" description="Pelunasan pesanan Custom Sablon" />
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 mt-6 mb-24">
        <Breadcrumb />
        
        <h1 className="text-4xl font-display font-medium uppercase tracking-tight text-aria-charcoal dark:text-white mb-10 mt-6 text-center">
          Pelunasan Tagihan
        </h1>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex justify-center">
          <div className="w-full">
            {/* Payment Section */}
            <div className="mb-8 border border-aria-charcoal dark:border-white p-6 relative overflow-hidden dark:bg-black text-center rounded-2xl">
              <h3 className="text-lg font-semibold tracking-widest uppercase text-aria-charcoal dark:text-white mb-2">Xendit Secure Payment</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-wider mb-6">
                Silakan lakukan pelunasan untuk sisa 50% tagihan produksi Anda. Ongkos kirim sudah diselesaikan di awal.
              </p>
              
              {orderError && (
                <div className="mb-6 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-center rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{orderError}</p>
                </div>
              )}

              <button onClick={processPayment} className="w-full max-w-sm mx-auto bg-aria-charcoal dark:bg-white text-white dark:text-black py-4 text-sm font-bold tracking-widest uppercase hover:bg-aria-maroon transition-colors rounded-xl">
                Bayar Pelunasan Sekarang
              </button>
            </div>

            {/* Order Summary Sidebar */}
            {order && (
              <div className="bg-gray-50 dark:bg-gray-900/50 p-6 self-start border border-gray-200 dark:border-gray-800 rounded-2xl">
                <h3 className="text-sm font-medium tracking-widest uppercase mb-4 pb-4 border-b border-gray-200 dark:border-gray-800 dark:text-white text-center">Order Summary</h3>
                
                {order.designRequests && order.designRequests.length > 0 && (
                  <div className="mb-6 space-y-4">
                    {order.designRequests.map((design, index) => (
                      <div key={design.id} className="border-b border-gray-200 dark:border-gray-800 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                        <div className="flex gap-4">
                          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                            {design.mockupPreviewUrl || design.designFileUrl ? (
                              <img src={design.mockupPreviewUrl || design.designFileUrl} alt={design.designTitle} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Img</div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1 uppercase tracking-widest">#{index + 1} - {design.designTitle}</p>
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Qty: {design.quantity} Pcs | Rp {Number(design.estimatedPrice || 0).toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-600 dark:text-gray-400">Total Biaya Produksi</span>
                  <span className="font-medium text-aria-charcoal dark:text-white">Rp {Number(order.totalPrice || order.totalAmount || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 pt-2 pb-4 border-b border-gray-200 dark:border-gray-800">
                  <span>DP Dibayarkan</span>
                  <span>- Rp {(order.totalPaid || Math.floor(Number(order.totalAmount)/2)).toLocaleString('id-ID')}</span>
                </div>

                <div className="flex justify-between text-lg font-bold uppercase tracking-widest pt-4 dark:text-white text-aria-charcoal">
                  <span>Total Pelunasan</span>
                  <span>Rp {Math.ceil(Number(order.totalAmount || 0) / 2).toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}

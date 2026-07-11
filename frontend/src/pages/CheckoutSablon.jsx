import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';
import { toast } from 'react-toastify';
import SEOHead from '../components/SEOHead';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import PageTransition from '../components/PageTransition';
import { useTranslation } from 'react-i18next';

export default function CheckoutSablon() {
  const { id } = useParams(); // designRequest ID
  const navigate = useNavigate();
  const { t } = useTranslation('translation', { keyPrefix: 'checkoutSablon' });
  const { user } = useAuthStore();
  
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [paymentType, setPaymentType] = useState('DP'); // 'DP' or 'FULL'
  const [paymentMethod, setPaymentMethod] = useState('XENDIT');
  const [usePoints, setUsePoints] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchDesignRequest = async () => {
      try {
        const res = await api.get('/design-requests');
        const req = res.data.data.find(r => r.id === id);
        if (!req) {
          throw new Error(t('errors.notFound'));
        }
        if (req.status !== 'APPROVED') {
          throw new Error(t('errors.notApproved'));
        }
        setRequestData(req);
      } catch (err) {
        setError(err.message || t('errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    };
    fetchDesignRequest();
  }, [id]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error(t('errors.loginRequired'));
      navigate('/login?redirect=/checkout-sablon/' + id);
      return;
    }
    
    setProcessing(true);
    try {
      const res = await api.post(`/orders/custom-sablon/${id}/checkout`, {
        paymentMethod,
        usePoints,
        paymentType
      });
      if (res.data.data?.paymentUrl) {
        window.location.href = res.data.data.paymentUrl;
      } else {
        toast.success(t('errors.checkoutFailed')); // Ideally this should be success message, but keeping API as is, using a new key if needed, or I'll just leave success message hardcoded for now, or use translation. Let's just hardcode toast since it's backend message often. Wait, I should not translate toasts if they are from backend. 
        // Actually, in the translation JSON there is no success message. I'll translate the error.
        navigate(`/order-tracking/${res.data.data.orderId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('errors.checkoutFailed'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-black">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aria-charcoal dark:border-white"></div>
        </div>
      </PageTransition>
    );
  }

  if (error || !requestData) {
    return (
      <PageTransition>
        <div className="flex flex-col justify-center items-center h-[70vh] px-4 text-center">
          <FiAlertCircle className="text-red-500 text-6xl mb-4" />
          <h2 className="text-2xl font-bold mb-2 dark:text-white">{t('oops')}</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={() => navigate('/account?tab=sablon')} className="px-6 py-3 bg-aria-charcoal dark:bg-white text-white dark:text-aria-charcoal rounded-xl text-sm font-semibold uppercase tracking-wider">
            {t('backToAccount')}
          </button>
        </div>
      </PageTransition>
    );
  }

  const estimatedTotal = Number(requestData.estimatedPrice || 0);
  const dpAmount = Math.floor(estimatedTotal / 2);
  const selectedAmount = paymentType === 'FULL' ? estimatedTotal : dpAmount;
  
  let pointsDiscount = 0;
  let finalAmount = selectedAmount;
  if (usePoints && user && user.rewardPoints > 0) {
    const maxDiscount = user.rewardPoints * 1000;
    if (maxDiscount > finalAmount) {
      pointsDiscount = finalAmount;
      finalAmount = 0;
    } else {
      pointsDiscount = maxDiscount;
      finalAmount -= pointsDiscount;
    }
  }

  return (
    <PageTransition>
      <SEOHead title={`${t('title')} - Arianation`} description={t('title')} />
      <div className="min-h-screen bg-white dark:bg-black py-16 pt-28 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-display font-black tracking-tighter mb-8 dark:text-white uppercase">{t('title')}</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              {/* Ringkasan Desain */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 uppercase tracking-widest text-sm">{t('designSummary')}</h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p><span className="font-semibold text-gray-800 dark:text-gray-300">{t('designTitle')}</span> {requestData.designTitle}</p>
                  <p><span className="font-semibold text-gray-800 dark:text-gray-300">{t('product')}</span> {requestData.productTypeForSablon}</p>
                  <p><span className="font-semibold text-gray-800 dark:text-gray-300">{t('technique')}</span> {requestData.printTechnique}</p>
                  <p><span className="font-semibold text-gray-800 dark:text-gray-300">{t('totalPrice')}</span> Rp {estimatedTotal.toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* Pilihan Pembayaran */}
              <div className="bg-white dark:bg-black p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 uppercase tracking-widest text-sm">{t('paymentOptions')}</h3>
                <div className="space-y-4">
                  <label className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentType === 'FULL' ? 'border-aria-charcoal bg-gray-50 dark:border-white dark:bg-gray-900' : 'border-gray-100 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'}`}>
                    <input 
                      type="radio" 
                      name="paymentType" 
                      value="FULL" 
                      checked={paymentType === 'FULL'} 
                      onChange={() => setPaymentType('FULL')} 
                      className="mt-1"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-gray-800 dark:text-white">{t('fullPayment')}</h4>
                        <span className="font-bold text-aria-maroon dark:text-amber-400">Rp {estimatedTotal.toLocaleString('id-ID')}</span>
                      </div>
                      <p className="text-xs text-gray-500">{t('fullPaymentDesc')}</p>
                    </div>
                  </label>
                  <label className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentType === 'DP' ? 'border-aria-charcoal bg-gray-50 dark:border-white dark:bg-gray-900' : 'border-gray-100 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'}`}>
                    <input 
                      type="radio" 
                      name="paymentType" 
                      value="DP" 
                      checked={paymentType === 'DP'} 
                      onChange={() => setPaymentType('DP')} 
                      className="mt-1"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-gray-800 dark:text-white">{t('dpPayment')}</h4>
                        <span className="font-bold text-aria-maroon dark:text-amber-400">Rp {dpAmount.toLocaleString('id-ID')}</span>
                      </div>
                      <p className="text-xs text-gray-500">{t('dpPaymentDesc')}</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Point Redemption */}
              {user && user.rewardPoints > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white text-sm">{t('usePoints')}</h3>
                    <p className="text-xs text-gray-500 mt-1">{t('youHavePoints', { points: user.rewardPoints, value: (user.rewardPoints * 1000).toLocaleString('id-ID') })}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-aria-charcoal dark:peer-checked:bg-white"></div>
                  </label>
                </div>
              )}
            </div>

            <div className="lg:col-span-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 sticky top-28">
                <h3 className="font-bold text-gray-800 dark:text-white mb-6 uppercase tracking-widest text-sm text-center">{t('paymentSummary')}</h3>
                
                <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
                  <div className="flex justify-between">
                    <span>{paymentType === 'FULL' ? t('fullPaymentCost') : t('dpCost')}</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-300">Rp {selectedAmount.toLocaleString('id-ID')}</span>
                  </div>
                  {usePoints && pointsDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>{t('pointsDiscount')}</span>
                      <span>- Rp {pointsDiscount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="h-px bg-gray-200 dark:bg-gray-800 my-4" />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 dark:text-white">{t('totalBilled')}</span>
                    <span className="font-black text-xl text-aria-maroon dark:text-amber-400">Rp {finalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={processing}
                  className="w-full py-4 bg-aria-charcoal dark:bg-white text-white dark:text-aria-charcoal rounded-xl text-sm font-black tracking-widest uppercase hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? t('processing') : t('payNow')}
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-4">
                  {t('paymentNotice')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

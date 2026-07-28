import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import Breadcrumb from '../components/Breadcrumb';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import ReviewModal from '../components/ReviewModal';
import { useTranslation } from 'react-i18next';


export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState(null);
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());
  const [uploadingRevision, setUploadingRevision] = useState(false);
  const [completingOrder, setCompletingOrder] = useState(false);
  
  // Refund states
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundBankName, setRefundBankName] = useState('');
  const [refundAccountNumber, setRefundAccountNumber] = useState('');
  const [refundAccountName, setRefundAccountName] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState('');
  
  const { t, i18n } = useTranslation('translation');
  const currentUser = useAuthStore((s) => s.user);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data.data || res.data);
        
        // Cek ulasan yang sudah diberikan jika user sedang login dan order ini milik user
        const orderData = res.data.data || res.data;
        if (currentUser && orderData.userId === currentUser.id && orderData.status === 'DELIVERED') {
           // We can check which items are reviewed. Actually, a simpler way is to let backend handle "already reviewed" error,
           // but for UX, let's just show it. We'll track it in local state upon successful review.
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load order details. Please verify your order ID.');
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id, currentUser]);

  const handleCompleteOrder = async () => {
    if (!window.confirm("Apakah Anda yakin telah menerima pesanan ini dengan baik?")) return;
    
    try {
      setCompletingOrder(true);
      await api.post(`/orders/${id}/complete`);
      
      // Reload order details
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.data || res.data);
      alert("Terima kasih! Pesanan telah diselesaikan dan poin Anda telah ditambahkan.");
    } catch (err) {
      alert("Gagal menyelesaikan pesanan: " + (err.response?.data?.message || err.message));
    } finally {
      setCompletingOrder(false);
    }
  };

  const handleSubmitRefund = async (e) => {
    e.preventDefault();
    if (!refundReason.trim()) {
      setRefundError('Alasan pembatalan/refund wajib diisi.');
      return;
    }
    if (!refundBankName.trim() || !refundAccountNumber.trim() || !refundAccountName.trim()) {
      setRefundError('Semua detail rekening bank wajib diisi untuk keperluan transfer dana.');
      return;
    }
    try {
      setRefundSubmitting(true);
      setRefundError('');
      await api.post(`/orders/${id}/request-refund`, { 
        reason: refundReason,
        bankName: refundBankName,
        accountNumber: refundAccountNumber,
        accountName: refundAccountName
      });
      setRefundModalOpen(false);
      setOrder(prev => ({ ...prev, status: 'REFUND_REQUESTED' }));
    } catch (err) {
      setRefundError(err.response?.data?.message || 'Gagal mengajukan refund.');
    } finally {
      setRefundSubmitting(false);
    }
  };

  const handleReuploadDesign = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingRevision(true);
      const sablonData = order.designRequest || (order.designRequests && order.designRequests[0]);
      if (!sablonData) throw new Error("Data sablon tidak ditemukan");

      const formData = new FormData();
      formData.append('designFile', file);

      await api.post(`/design-requests/${sablonData.id}/upload-file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Reload order details
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.data || res.data);
      alert("File berhasil diunggah! Admin akan segera melakukan review ulang.");
    } catch (err) {
      alert("Gagal mengunggah file revisi: " + (err.response?.data?.message || err.message));
    } finally {
      setUploadingRevision(false);
      e.target.value = null; // reset input
    }
  };

  const currentDesignReq = order?.designRequest || (order?.designRequests && order.designRequests[0]);

  return (
    <>
      <SEOHead title={`Track Order ${id || ''} - Arianation`} />
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 mt-6 mb-24">
        <Breadcrumb customLabels={{ 'order-tracking': 'Track Order', [id]: order?.orderNumber || id }} />

        <div className="mt-8 mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-medium uppercase tracking-tight text-aria-charcoal dark:text-white mb-4">
            {t('orderTracking.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            {t('orderTracking.subtitle')}
          </p>
        </div>

        {loading && (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-2 border-aria-charcoal dark:border-white border-t-transparent dark:border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">{t('orderTracking.loading')}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-6 text-center text-sm uppercase tracking-widest">
            {error}
          </div>
        )}

        {order && !loading && !error && (
          <div className="space-y-8">
            {/* Warning to save link for guests */}
            {!order.userId && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 p-6 text-sm colorblind:border-aria-cb-warning colorblind:border-2">
                <div className="flex items-start gap-4">
                  <div className="text-yellow-600 dark:text-yellow-500 colorblind:text-aria-cb-warning mt-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold uppercase tracking-widest text-yellow-800 dark:text-yellow-400 colorblind:text-aria-cb-warning mb-1">{t('orderTracking.saveLinkTitle')}</h3>
                    <p className="text-yellow-700 dark:text-yellow-200/80 leading-relaxed mb-4">
                      {t('orderTracking.saveLinkDesc')} <strong className="dark:text-white">{t('orderTracking.copyDesc')}</strong>
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 colorblind:text-aria-cb-error font-medium leading-relaxed mb-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 colorblind:border-aria-cb-error colorblind:border-2">
                      {t('orderTracking.warningDesc')}
                    </p>
                    <button 
                      onClick={handleCopyLink}
                      className="bg-yellow-800 hover:bg-yellow-900 dark:bg-yellow-600 dark:hover:bg-yellow-700 colorblind:bg-aria-cb-warning colorblind:hover:bg-opacity-80 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                      {copied ? (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> {t('orderTracking.copiedBtn')}</>
                      ) : (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> {t('orderTracking.copyBtn')}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Sablon CTA for CONFIRMED */}
            {order.orderNumber?.startsWith('SAB-') && order.status === 'CONFIRMED' && (
              <div className="bg-aria-charcoal dark:bg-gray-800 text-white p-8 border border-transparent colorblind:border-aria-cb-warning colorblind:border-2 mb-6">
                <h3 className="font-display text-xl uppercase tracking-widest mb-4">Lanjutkan Pembayaran</h3>
                <p className="text-sm text-gray-300 dark:text-gray-400 leading-relaxed mb-6 uppercase tracking-widest">
                  Desain Anda telah disetujui oleh admin. Silakan pilih metode pembayaran (DP 50% atau Lunas 100%) untuk memulai proses produksi.
                </p>
                <div className="flex gap-4">
                  <Link 
                    to={`/checkout-sablon/${order.id}`} 
                    className="bg-white text-black hover:bg-gray-200 px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors inline-block text-center animate-pulse"
                  >
                    BAYAR SEKARANG
                  </Link>
                </div>
              </div>
            )}

            {/* Custom Sablon DP Summary */}
            {order.orderNumber?.startsWith('SAB-') && (order.status === 'PENDING' || order.status === 'WAITING_FINAL_PAYMENT') && currentDesignReq?.status !== 'REVISION_REQUESTED' && (
              <div className="bg-white dark:bg-black p-8 border border-gray-200 dark:border-gray-800 mb-6 flex flex-col gap-4">
                <h3 className="font-display text-lg uppercase tracking-widest border-b border-gray-200 dark:border-gray-800 pb-2">Order Summary (Custom Sablon)</h3>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 uppercase tracking-widest">Total Harga Sablon (100%)</span>
                  <span className="font-medium">Rp {(order.totalAmount || 0).toLocaleString('id-ID')}</span>
                </div>
                {order.paymentOption && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 uppercase tracking-widest">Jenis Pembayaran</span>
                    <span className={`font-bold ${order.paymentOption === 'DP_50' ? 'text-amber-600' : 'text-blue-600'}`}>
                      {order.paymentOption === 'LUNAS' ? 'Lunas 100%' : (order.status === 'WAITING_FINAL_PAYMENT' ? 'Pelunasan (Sisa 50%)' : 'Uang Muka (DP 50%)')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg mt-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <span className="font-bold uppercase tracking-widest">Total Tagihan Ini</span>
                  <span className="font-display font-bold">
                    Rp {
                      (order.paymentOption === 'DP_50' && order.status === 'PENDING' ? Math.floor((order.totalAmount || 0) / 2) + (order.shippingCost || 0) :
                       order.paymentOption === 'DP_50' && order.status === 'WAITING_FINAL_PAYMENT' ? Math.ceil((order.totalAmount || 0) / 2) : 
                       (order.totalAmount || 0) + (order.shippingCost || 0)).toLocaleString('id-ID')
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Payment Instructions if Pending */}
            {(order.paymentStatus === 'PENDING' || order.paymentStatus === 'UNPAID') && !['CANCELLED', 'ABANDONED'].includes(order.status) && !(order.orderNumber?.startsWith('SAB-') && (order.status === 'CONFIRMED' || currentDesignReq?.status === 'REVISION_REQUESTED')) && (
              <div className="bg-aria-charcoal dark:bg-gray-800 text-white p-8 border border-transparent colorblind:border-aria-cb-warning colorblind:border-2">
                <h3 className="font-display text-xl uppercase tracking-widest mb-4">{t('orderTracking.paymentTitle')}</h3>
                
                {order.paymentMethod === 'XENDIT' && order.paymentUrl ? (
                  <>
                    <p className="text-sm text-gray-300 dark:text-gray-400 leading-relaxed mb-6 uppercase tracking-widest">
                      {t('orderTracking.paymentPendingXendit')}
                    </p>
                    <div className="flex flex-wrap gap-4 items-center">
                      <a 
                        href={order.paymentUrl} 
                        className="bg-white text-black hover:bg-gray-200 px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors inline-block text-center"
                      >
                        {t('orderTracking.payNow')}
                      </a>
                      {order.orderNumber?.startsWith('SAB-') && order.status === 'PENDING' && (
                        <Link 
                          to={`/checkout-sablon/${order.id}`} 
                          className="bg-transparent border border-white text-white hover:bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors inline-block text-center"
                        >
                          Ubah Pembayaran / Pengiriman
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-300 dark:text-gray-400 leading-relaxed mb-6 uppercase tracking-widest">
                      {t('orderTracking.paymentDesc')}
                    </p>
                    <div className="bg-black/30 dark:bg-black/50 p-6 border border-white/10 dark:border-white/5 text-sm uppercase tracking-wider font-medium space-y-2">
                      <p><span className="text-gray-400 dark:text-gray-500 inline-block w-28">{t('orderTracking.bank')}</span> BCA (Bank Central Asia)</p>
                      <p><span className="text-gray-400 dark:text-gray-500 inline-block w-28">{t('orderTracking.account')}</span> 8273 4829 10</p>
                      <p><span className="text-gray-400 dark:text-gray-500 inline-block w-28">{t('orderTracking.name')}</span> Arianation Official</p>
                      <p><span className="text-gray-400 dark:text-gray-500 inline-block w-28">{t('orderTracking.amount')}</span> Rp {(order.totalPrice || order.totalAmount)?.toLocaleString('id-ID')}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* WAITING_FINAL_PAYMENT Call to Action */}
            {order.status === 'WAITING_FINAL_PAYMENT' && order.userId === currentUser?.id && currentDesignReq?.status !== 'REVISION_REQUESTED' && (
              <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-400 p-8 border border-amber-200 dark:border-amber-700/50">
                <h3 className="font-display text-xl uppercase tracking-widest mb-4">{t('orderTracking.sablonTitle')}</h3>
                <p className="text-sm leading-relaxed mb-6 uppercase tracking-widest">
                  {t('orderTracking.sablonDesc')}
                </p>
                <div className="flex gap-4">
                  <Link 
                    to={`/checkout-pelunasan/${order.id}`} 
                    className="bg-amber-600 text-white hover:bg-amber-700 px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors inline-block text-center"
                  >
                    {t('orderTracking.payRemaining')}
                  </Link>
                </div>
              </div>
            )}

            {/* REVISION REQUESTED CTA Alert Box */}
            {order.orderNumber?.startsWith('SAB-') && currentDesignReq?.status === 'REVISION_REQUESTED' && (
              <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-400 p-8 border border-orange-200 dark:border-orange-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-8 h-8 text-orange-600 dark:text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <h3 className="font-display text-xl uppercase tracking-widest text-orange-800 dark:text-orange-500">DESAIN PERLU DISESUAIKAN</h3>
                </div>
                <p className="text-sm leading-relaxed mb-4 uppercase tracking-widest font-medium">
                  Tim kami menemukan bahwa desain Anda perlu sedikit penyesuaian agar hasil sablon maksimal. 
                  Silakan hubungi admin kami untuk diskusi, atau unggah ulang file desain yang baru jika Anda sudah memperbaikinya.
                </p>
                <div className="bg-white/50 dark:bg-black/20 p-4 mb-6 border border-orange-200 dark:border-orange-800/50 text-sm">
                  <strong className="block mb-1 uppercase tracking-widest text-xs text-orange-600 dark:text-orange-500">Catatan dari Admin:</strong>
                  <p className="italic text-gray-700 dark:text-gray-300">{currentDesignReq?.rejectReason || 'Silakan cek email atau hubungi WA.'}</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <a 
                    href={`https://wa.me/6281234567890?text=Halo%20Admin,%20saya%20ingin%20diskusi%20revisi%20desain%20untuk%20Order%20${order.orderNumber}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-green-600 text-white hover:bg-green-700 px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                    Konsultasi via WhatsApp
                  </a>
                  <label className="bg-aria-charcoal dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors inline-flex items-center justify-center gap-2 cursor-pointer">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    {uploadingRevision ? 'Mengunggah...' : 'Upload Ulang Desain'}
                    <input type="file" className="hidden" accept="image/*" onChange={handleReuploadDesign} disabled={uploadingRevision} />
                  </label>
                </div>
              </div>
            )}

            {/* Refund Action Box (Only for CONFIRMED, PAID_WAITING_APPROVAL, or PROCESSING (Retail) and owner/guest) */}
            {(() => {
              const isSablon = order.designRequests && order.designRequests.length > 0;
              const canRefund = isSablon 
                ? (order.status === 'CONFIRMED' || order.status === 'PAID_WAITING_APPROVAL')
                : (order.status === 'CONFIRMED' || order.status === 'PAID_WAITING_APPROVAL' || order.status === 'PROCESSING');
                
              return canRefund && (!order.userId || order.userId === currentUser?.id) && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-400 p-8 border border-red-200 dark:border-red-700/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="font-display text-lg uppercase tracking-widest mb-1">Ajukan Pembatalan & Refund</h3>
                    <p className="text-xs leading-relaxed uppercase tracking-widest text-red-700 dark:text-red-300">
                      Sesuai S&K, Anda dapat membatalkan pesanan dan meminta refund karena pesanan belum diproduksi/dikirim.
                    </p>
                  </div>
                  <button 
                    onClick={() => setRefundModalOpen(true)}
                    className="bg-red-600 text-white hover:bg-red-700 px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors inline-block text-center whitespace-nowrap"
                  >
                    Ajukan Refund
                  </button>
                </div>
              );
            })()}

            {/* Complete Order Action Box */}
            {['SHIPPED', 'DELIVERED', 'READY_FOR_DELIVERY'].includes(order.status) && (!order.userId || order.userId === currentUser?.id) && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-400 p-8 border border-emerald-200 dark:border-emerald-700/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h3 className="font-display text-lg uppercase tracking-widest mb-1">Pesanan Diterima</h3>
                  <p className="text-xs leading-relaxed uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                    Jika pesanan telah Anda terima dengan baik, silakan konfirmasi untuk menyelesaikan pesanan dan mendapatkan Poin Reward.
                  </p>
                </div>
                <button 
                  onClick={handleCompleteOrder}
                  disabled={completingOrder}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors inline-block text-center whitespace-nowrap disabled:opacity-50"
                >
                  {completingOrder ? 'Memproses...' : 'Pesanan Diterima'}
                </button>
              </div>
            )}

            {/* ON_HOLD Warning */}
            {order.status === 'ON_HOLD' && (
              <div className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-6 border-l-4 border-gray-500 uppercase tracking-widest text-sm">
                <strong>Pesanan Dibekukan:</strong> Pesanan Anda dibekukan (ON HOLD) karena melewati batas waktu pelunasan atau permasalahan operasional. Silakan hubungi admin.
              </div>
            )}

          <div className="border border-gray-200 dark:border-gray-800">
            {/* Header Info */}
            <div className="p-8 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{t('orderTracking.orderId')}</p>
                <p className="font-display text-lg text-aria-charcoal dark:text-white uppercase tracking-wider">{order.orderNumber || order.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{t('orderTracking.date')}</p>
                <p className="text-sm font-medium uppercase tracking-widest dark:text-gray-300">
                  {new Intl.DateTimeFormat(i18n.language === 'EN' ? 'en-US' : 'id-ID', { dateStyle: 'long' }).format(new Date(order.createdAt))}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{t('orderTracking.status')}</p>
                  <span className={`px-4 py-2 text-xs font-bold uppercase tracking-widest inline-block 
                    ${order.orderNumber?.startsWith('SAB-') && currentDesignReq?.status === 'REVISION_REQUESTED' ? 'bg-orange-600 text-white dark:bg-orange-600 dark:text-white' : ''}
                    ${order.status === 'PENDING' && (!order.orderNumber?.startsWith('SAB-') || currentDesignReq?.status !== 'REVISION_REQUESTED') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 colorblind:bg-aria-cb-warning colorblind:text-white' : ''}
                    ${order.status === 'CONFIRMED' || order.status === 'WAITING_FINAL_PAYMENT' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400' : ''}
                    ${order.status === 'PROCESSING' || order.status === 'IN_PRODUCTION' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400' : ''}
                    ${order.status === 'SHIPPED' || order.status === 'READY_TO_SHIP' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400' : ''}
                    ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 colorblind:bg-aria-cb-success colorblind:text-white' : ''}
                    ${!['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','IN_PRODUCTION','WAITING_FINAL_PAYMENT','READY_TO_SHIP'].includes(order.status) ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' : ''}
                  `}>
                    {order.orderNumber?.startsWith('SAB-') && currentDesignReq?.status === 'REVISION_REQUESTED' ? 'REVISI DIBUTUHKAN' : (order.status === 'CONFIRMED' ? 'MENUNGGU PEMBAYARAN' : (t(`order_status.${order.status}`) || t(`order_status.PENDING`)))}
                  </span>
                </div>
              </div>

            {/* Details */}
            <div className="p-8 dark:bg-black">
              <h2 className="text-sm font-semibold tracking-widest uppercase mb-6 pb-4 border-b border-gray-200 dark:border-gray-800 dark:text-white">{t('orderTracking.shipping')}</h2>
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">{t('orderTracking.recipient')}</p>
                  <p className="text-sm uppercase tracking-wider font-medium mb-1 dark:text-gray-300">
                    {order.deliveryAddress?.firstName || order.deliveryAddress?.fullName || order.User?.fullName} {order.deliveryAddress?.lastName || ''}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-relaxed mt-2">
                    {order.deliveryAddress?.address || order.deliveryAddress?.addressLine1 || t('orderTracking.unavailable')}<br />
                    {order.deliveryAddress?.city}, {order.deliveryAddress?.postalCode}
                  </p>
                </div>
                <div>
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">{t('orderTracking.paymentStatus')}</p>
                    <p className={`text-sm uppercase tracking-wider font-medium ${order.paymentStatus === 'PENDING' ? 'text-yellow-600 dark:text-yellow-500 colorblind:text-aria-cb-warning' : 'dark:text-gray-300'}`}>
                      {order.paymentStatus === 'PENDING' ? t('orderTracking.unpaid') : order.paymentStatus}
                    </p>
                  </div>
                  
                  {order.trackingNumber && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">{t('orderTracking.trackingNumber')}</p>
                      <p className="text-sm uppercase tracking-wider font-medium bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 inline-block dark:text-white">
                        {order.trackingNumber}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Summary - Optional based on data */}
              {((order.items && order.items.length > 0) || order.designRequest || (order.designRequests && order.designRequests.length > 0)) && (
                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                  <h2 className="text-sm font-semibold tracking-widest uppercase mb-6 dark:text-white">{t('orderTracking.orderItems')}</h2>
                  <div className="space-y-4">
                    {(() => {
                      let itemsToRender = order.items || [];
                      const sablonData = order.designRequest || (order.designRequests && order.designRequests[0]);
                      
                      // Inject dummy item for Custom Sablon if no items exist
                      if (itemsToRender.length === 0 && sablonData) {
                        itemsToRender = [{
                          id: sablonData.id,
                          productId: sablonData.id,
                          itemType: 'CUSTOM_SABLON',
                          productName: `Custom Sablon - ${sablonData.designTitle}`,
                          quantity: sablonData.quantity || 1,
                          unitPrice: (order.totalAmount || order.totalPrice) / (sablonData.quantity || 1),
                          color: sablonData.colorPreferences,
                          size: sablonData.sizeBreakdown ? 'Custom Size' : ''
                        }];
                      }

                      return itemsToRender.map((item, idx) => {
                        const isSablon = !!sablonData;

                      return (
                        <div key={`item-${item.id || idx}-${item.productId || ''}`} className="flex flex-col gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
                          <div className="flex justify-between items-start text-sm gap-4">
                            <div className="flex gap-4 items-start">
                              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex-shrink-0">
                                <img 
                                  src={(sablonData && sablonData.mockupPreviewUrl) ? sablonData.mockupPreviewUrl : (item.variantImage || item.productImage || item.product?.imageUrl || item.product?.images?.[0] || (sablonData ? sablonData.designFileUrl : 'https://via.placeholder.com/80'))} 
                                  alt={item.productName || item.product?.productName || (sablonData ? `Custom Sablon - ${sablonData.designTitle}` : 'Product')} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="uppercase tracking-widest font-bold text-gray-800 dark:text-gray-200">
                                  {item.productName || item.product?.productName || (sablonData ? `Custom Sablon - ${sablonData.designTitle}` : 'Product')}
                                </span>
                                <span className="uppercase tracking-widest text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {item.quantity}x {item.color || (item.size && item.size.includes('-') ? item.size.split('-')[0].trim() : '')} {item.size && item.size.includes('-') ? `| ${item.size.split('-')[1].trim()}` : (item.size ? `| ${item.size}` : '')}
                                </span>
                                {isSablon && sablonData && (
                                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-0.5 bg-gray-50 dark:bg-gray-900 p-2 rounded-md border border-gray-100 dark:border-gray-800">
                                    {sablonData.printTechnique && <p><span className="font-medium text-gray-600 dark:text-gray-300">Teknik:</span> {sablonData.printTechnique}</p>}
                                    {sablonData.printPosition && <p><span className="font-medium text-gray-600 dark:text-gray-300">Posisi:</span> {sablonData.printPosition}</p>}
                                    {sablonData.printSize && <p><span className="font-medium text-gray-600 dark:text-gray-300">Ukuran Sablon:</span> {sablonData.printSize}</p>}
                                    {sablonData.colorPreferences && <p><span className="font-medium text-gray-600 dark:text-gray-300">Warna Produk:</span> {sablonData.colorPreferences}</p>}
                                    {sablonData.sizeBreakdown && (
                                      <p><span className="font-medium text-gray-600 dark:text-gray-300">Ukuran Baju/Tas:</span> {
                                        (() => {
                                          if (typeof sablonData.sizeBreakdown === 'object') {
                                            return Object.entries(sablonData.sizeBreakdown).filter(([_,v]) => parseInt(v) > 0).map(([k,v]) => `${k}: ${v}`).join(', ');
                                          }
                                          try {
                                            const parsed = JSON.parse(sablonData.sizeBreakdown);
                                            return Object.entries(parsed).filter(([_,v]) => parseInt(v) > 0).map(([k,v]) => `${k}: ${v}`).join(', ');
                                          } catch (e) {
                                            return String(sablonData.sizeBreakdown);
                                          }
                                        })()
                                      }</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          <span className="font-medium dark:text-white mt-1">Rp {((item.unitPrice || item.price) * item.quantity).toLocaleString('id-ID')}</span>
                        </div>
                        {order.status === 'DELIVERED' && currentUser && order.userId === currentUser.id && (
                          <div className="flex justify-end">
                            {reviewedProductIds.has(item.productId) ? (
                              <span className="text-xs text-green-600 flex items-center gap-1 font-bold">
                                {t('orderTracking.reviewSent')}
                              </span>
                            ) : (
                              <button 
                                onClick={() => {
                                  setSelectedOrderItem({
                                    productId: item.productId,
                                    productName: item.productName || item.product?.productName || (sablonData ? `Custom Sablon - ${sablonData.designTitle}` : 'Produk'),
                                    productImage: (sablonData && sablonData.mockupPreviewUrl) ? sablonData.mockupPreviewUrl : (item.variantImage || item.productImage || item.product?.images?.[0] || (sablonData ? sablonData.designFileUrl : '')),
                                    size: item.size,
                                    color: item.color,
                                    itemType: item.itemType
                                  });
                                  setReviewModalOpen(true);
                                }}
                                className="text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded shadow-sm transition-colors uppercase tracking-widest"
                              >
                                {t('orderTracking.leaveReview')}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })})()}
                  </div>
                  {order.shippingCost > 0 && (
                    <div className="flex justify-between items-center mt-4 text-sm uppercase tracking-widest text-gray-600 dark:text-gray-400">
                      <span>SHIPPING ({order.shippingCourier || 'Courier'})</span>
                      <span>Rp {order.shippingCost?.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-6 text-lg font-semibold uppercase tracking-widest dark:text-white">
                    <span>{t('orderTracking.total')}</span>
                    <span>Rp {(order.totalPrice || order.totalAmount)?.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link to="/" className="inline-block border border-aria-charcoal dark:border-white px-8 py-4 text-sm font-medium tracking-[0.15em] uppercase hover:bg-aria-charcoal dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors">
            {t('orderTracking.returnStore')}
          </Link>
        </div>
      </div>
      
      <ReviewModal 
        isOpen={reviewModalOpen} 
        onClose={() => setReviewModalOpen(false)} 
        orderItem={selectedOrderItem}
        orderId={order?.id}
        onSuccess={(productId) => {
          setReviewedProductIds(prev => new Set(prev).add(productId));
        }}
      />

      {/* Refund Modal */}
      {refundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 w-full max-w-md p-6 relative">
            <button 
              onClick={() => setRefundModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black dark:hover:text-white"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h3 className="font-display text-xl uppercase tracking-widest mb-4 dark:text-white">Ajukan Refund</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-widest leading-relaxed">
              Pesanan belum diproses/dikirim sehingga aman untuk dibatalkan. Dana Anda akan dikembalikan (dipotong biaya admin, transfer, atau biaya desain jika ada). Silakan tulis alasan pembatalan di bawah ini.
            </p>
            {refundError && (
              <div className="bg-red-50 text-red-600 p-3 mb-4 text-xs font-medium border border-red-200">
                {refundError}
              </div>
            )}
            <form onSubmit={handleSubmitRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 mb-2">Alasan Pembatalan</label>
                <textarea
                  required
                  rows="2"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white transition-colors dark:text-white"
                  placeholder="Ceritakan alasannya..."
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 mb-2">Nama Bank / E-Wallet</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white transition-colors dark:text-white"
                    placeholder="BCA / GoPay"
                    value={refundBankName}
                    onChange={e => setRefundBankName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 mb-2">Nomor Rekening</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white transition-colors dark:text-white"
                    placeholder="123456789"
                    value={refundAccountNumber}
                    onChange={e => setRefundAccountNumber(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 mb-2">Nama Pemilik Rekening</label>
                <input
                  required
                  type="text"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white transition-colors dark:text-white"
                  placeholder="Budi Santoso"
                  value={refundAccountName}
                  onChange={e => setRefundAccountName(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={refundSubmitting}
                className={`w-full py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors ${refundSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {refundSubmitting ? 'Memproses...' : 'Kirim Permintaan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

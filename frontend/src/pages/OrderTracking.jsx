import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import Breadcrumb from '../components/Breadcrumb';
import api from '../services/api';
import useUIStore from '../store/uiStore';
import useAuthStore from '../store/authStore';
import ReviewModal from '../components/ReviewModal';

const TRANSLATIONS = {
  ID: {
    title: 'Lacak Pesanan',
    subtitle: 'Cek status pesanan dan detail belanja Anda di bawah ini.',
    loading: 'Memuat data pesanan...',
    saveLinkTitle: 'Penting: Simpan Link Ini',
    saveLinkDesc: 'Anda berbelanja sebagai Tamu (tanpa akun). ',
    copyDesc: 'Harap Salin (Copy) link URL ini agar Anda bisa melihat halaman ini dan mengecek status pesanan Anda besok atau kapan saja.',
    warningDesc: 'PERINGATAN: Jika Anda tidak menyalin link ini dan kehilangan akses pelacakan, pihak Arianation tidak bertanggung jawab atas hilangnya data pelacakan pesanan Anda.',
    copyBtn: 'Salin Link',
    copiedBtn: 'Tersalin!',
    paymentTitle: 'Instruksi Pembayaran',
    paymentDesc: 'Silakan transfer tepat sesuai total tagihan ke rekening berikut agar pesanan Anda dapat segera kami proses.',
    bank: 'Bank:',
    account: 'No. Rekening:',
    name: 'Atas Nama:',
    amount: 'Total Bayar:',
    orderId: 'ID Pesanan',
    date: 'Tanggal',
    status: 'Status',
    shipping: 'Informasi Pengiriman',
    recipient: 'Penerima',
    unavailable: 'Alamat tidak tersedia',
    paymentStatus: 'Status Pembayaran',
    unpaid: 'BELUM DIBAYAR',
    trackingNumber: 'Nomor Resi (Kurir)',
    orderItems: 'Daftar Barang Belanjaan',
    total: 'Total',
    returnStore: 'Kembali ke Beranda Belanja',
  },
  EN: {
    title: 'Track Order',
    subtitle: 'Check your order status and details below.',
    loading: 'Loading order data...',
    saveLinkTitle: 'Important: Save This Link',
    saveLinkDesc: 'You checked out as a guest. ',
    copyDesc: 'Please copy this URL link so you can check your order status later.',
    warningDesc: 'WARNING: If you fail to save this link and lose your tracking access, Arianation is not responsible for any lost order tracking data.',
    copyBtn: 'Copy Link',
    copiedBtn: 'Copied!',
    paymentTitle: 'Payment Instructions',
    paymentDesc: 'Please complete your payment via Bank Transfer to the following account to process your order.',
    bank: 'Bank:',
    account: 'Account:',
    name: 'Name:',
    amount: 'Amount:',
    orderId: 'Order ID',
    date: 'Date',
    status: 'Status',
    shipping: 'Shipping Information',
    recipient: 'Recipient',
    unavailable: 'Address unavailable',
    paymentStatus: 'Payment Status',
    unpaid: 'UNPAID',
    trackingNumber: 'Tracking Number',
    orderItems: 'Order Items',
    total: 'Total',
    returnStore: 'Return to Store',
  }
};

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState(null);
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());
  
  const language = useUIStore((s) => s.language) || 'ID';
  const t = TRANSLATIONS[language];
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
  }, [id]);

  return (
    <>
      <SEOHead title={`Track Order ${id || ''} - Arianation`} />
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 mt-6 mb-24">
        <Breadcrumb />

        <div className="mt-8 mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-medium uppercase tracking-tight text-aria-charcoal dark:text-white mb-4">
            {t.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            {t.subtitle}
          </p>
        </div>

        {loading && (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-2 border-aria-charcoal dark:border-white border-t-transparent dark:border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">{t.loading}</p>
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
                    <h3 className="font-semibold uppercase tracking-widest text-yellow-800 dark:text-yellow-400 colorblind:text-aria-cb-warning mb-1">{t.saveLinkTitle}</h3>
                    <p className="text-yellow-700 dark:text-yellow-200/80 leading-relaxed mb-4">
                      {t.saveLinkDesc} <strong className="dark:text-white">{t.copyDesc}</strong>
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 colorblind:text-aria-cb-error font-medium leading-relaxed mb-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 colorblind:border-aria-cb-error colorblind:border-2">
                      {t.warningDesc}
                    </p>
                    <button 
                      onClick={handleCopyLink}
                      className="bg-yellow-800 hover:bg-yellow-900 dark:bg-yellow-600 dark:hover:bg-yellow-700 colorblind:bg-aria-cb-warning colorblind:hover:bg-opacity-80 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                      {copied ? (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> {t.copiedBtn}</>
                      ) : (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> {t.copyBtn}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Instructions if Pending */}
            {(order.paymentStatus === 'PENDING' || order.paymentStatus === 'UNPAID') && (
              <div className="bg-aria-charcoal dark:bg-gray-800 text-white p-8 border border-transparent colorblind:border-aria-cb-warning colorblind:border-2">
                <h3 className="font-display text-xl uppercase tracking-widest mb-4">{t.paymentTitle}</h3>
                <p className="text-sm text-gray-300 dark:text-gray-400 leading-relaxed mb-6 uppercase tracking-widest">
                  {t.paymentDesc}
                </p>
                <div className="bg-black/30 dark:bg-black/50 p-6 border border-white/10 dark:border-white/5 text-sm uppercase tracking-wider font-medium space-y-2">
                  <p><span className="text-gray-400 dark:text-gray-500 inline-block w-28">{t.bank}</span> BCA (Bank Central Asia)</p>
                  <p><span className="text-gray-400 dark:text-gray-500 inline-block w-28">{t.account}</span> 8273 4829 10</p>
                  <p><span className="text-gray-400 dark:text-gray-500 inline-block w-28">{t.name}</span> Arianation Official</p>
                  <p><span className="text-gray-400 dark:text-gray-500 inline-block w-28">{t.amount}</span> Rp {(order.totalPrice || order.totalAmount)?.toLocaleString('id-ID')}</p>
                </div>
              </div>
            )}

          <div className="border border-gray-200 dark:border-gray-800">
            {/* Header Info */}
            <div className="p-8 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{t.orderId}</p>
                <p className="font-display text-lg text-aria-charcoal dark:text-white uppercase tracking-wider">{order.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{t.date}</p>
                <p className="text-sm font-medium uppercase tracking-widest dark:text-gray-300">
                  {new Date(order.createdAt).toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{t.status}</p>
                <span className={`px-4 py-2 text-xs font-bold uppercase tracking-widest inline-block 
                  ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 colorblind:bg-aria-cb-warning colorblind:text-white' : ''}
                  ${order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400' : ''}
                  ${order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400' : ''}
                  ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 colorblind:bg-aria-cb-success colorblind:text-white' : ''}
                  ${!['PENDING','PROCESSING','SHIPPED','DELIVERED'].includes(order.status) ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' : ''}
                `}>
                  {order.status || 'PENDING'}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="p-8 dark:bg-black">
              <h2 className="text-sm font-semibold tracking-widest uppercase mb-6 pb-4 border-b border-gray-200 dark:border-gray-800 dark:text-white">{t.shipping}</h2>
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">{t.recipient}</p>
                  <p className="text-sm uppercase tracking-wider font-medium mb-1 dark:text-gray-300">
                    {order.deliveryAddress?.firstName || order.deliveryAddress?.fullName || order.User?.fullName} {order.deliveryAddress?.lastName || ''}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-relaxed mt-2">
                    {order.deliveryAddress?.address || order.deliveryAddress?.addressLine1 || t.unavailable}<br />
                    {order.deliveryAddress?.city}, {order.deliveryAddress?.postalCode}
                  </p>
                </div>
                <div>
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">{t.paymentStatus}</p>
                    <p className={`text-sm uppercase tracking-wider font-medium ${order.paymentStatus === 'PENDING' ? 'text-yellow-600 dark:text-yellow-500 colorblind:text-aria-cb-warning' : 'dark:text-gray-300'}`}>
                      {order.paymentStatus === 'PENDING' ? t.unpaid : order.paymentStatus}
                    </p>
                  </div>
                  
                  {order.trackingNumber && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">{t.trackingNumber}</p>
                      <p className="text-sm uppercase tracking-wider font-medium bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 inline-block dark:text-white">
                        {order.trackingNumber}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Summary - Optional based on data */}
              {order.items && order.items.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                  <h2 className="text-sm font-semibold tracking-widest uppercase mb-6 dark:text-white">{t.orderItems}</h2>
                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex flex-col gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <div className="flex justify-between items-start text-sm">
                          <span className="uppercase tracking-widest text-gray-600 dark:text-gray-400">
                            {item.quantity}x {item.product?.productName || 'Product'} {item.size && `- ${item.size}`} {item.color && `- ${item.color}`}
                          </span>
                          <span className="font-medium dark:text-white">Rp {((item.unitPrice || item.price) * item.quantity).toLocaleString('id-ID')}</span>
                        </div>
                        {order.status === 'DELIVERED' && currentUser && order.userId === currentUser.id && (
                          <div className="flex justify-end">
                            {reviewedProductIds.has(item.productId) ? (
                              <span className="text-xs text-green-600 flex items-center gap-1 font-bold">
                                ✓ Ulasan Terkirim
                              </span>
                            ) : (
                              <button 
                                onClick={() => {
                                  setSelectedOrderItem({
                                    productId: item.productId,
                                    productName: item.product?.productName || 'Produk',
                                    productImage: item.product?.images?.[0] || '',
                                    size: item.size,
                                    color: item.color
                                  });
                                  setReviewModalOpen(true);
                                }}
                                className="text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded shadow-sm transition-colors uppercase tracking-widest"
                              >
                                Beri Ulasan (+500 Poin)
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-6 text-lg font-semibold uppercase tracking-widest dark:text-white">
                    <span>{t.total}</span>
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
            {t.returnStore}
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
    </>
  );
}

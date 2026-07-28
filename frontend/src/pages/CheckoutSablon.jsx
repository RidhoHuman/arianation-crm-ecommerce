import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';
import { toast } from 'react-toastify';
import SEOHead from '../components/SEOHead';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import PageTransition from '../components/PageTransition';
import { useTranslation } from 'react-i18next';
import ShippingMethodSelector from '../components/checkout/ShippingMethodSelector';

const addressSchema = z.object({
  firstName: z.string().min(1, 'Nama depan wajib diisi'),
  lastName: z.string().optional(),
  email: z.string().email('Email tidak valid').min(1, 'Email wajib diisi'),
  phone: z.string().min(1, 'Nomor telepon wajib diisi'),
  address: z.string().min(1, 'Alamat lengkap wajib diisi'),
  city: z.string().min(1, 'Kota wajib diisi'),
  postalCode: z.string().min(1, 'Kode pos wajib diisi')
});

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
  const [exchangeRate, setExchangeRate] = useState(10);
  const [maxDiscountPercent, setMaxDiscountPercent] = useState(50);
  const [processing, setProcessing] = useState(false);

  // SHIPPING STATES
  const [deliveryType, setDeliveryType] = useState('SHIPPING'); // 'SHIPPING' or 'PICKUP'
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [fetchingRates, setFetchingRates] = useState(false);
  const [shippingError, setShippingError] = useState(null);
  
  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      firstName: user?.fullName?.split(' ')[0] || '',
      lastName: user?.fullName?.split(' ')[1] || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: '',
      city: '',
      postalCode: '',
      country: 'INDONESIA'
    }
  });

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        const orderData = res.data.data;
        if (!orderData) {
          throw new Error(t('errors.notFound'));
        }
        if (orderData.status !== 'CONFIRMED' && orderData.status !== 'PENDING') {
          throw new Error(t('errors.notApproved', { defaultValue: 'Pesanan belum disetujui Admin atau sudah tidak bisa diubah' }));
        }
        setRequestData(orderData);
        
        // Auto-fill address from first design request
        if (orderData.designRequests && orderData.designRequests.length > 0) {
          const dr = orderData.designRequests[0];
          if (dr.shippingAddress && !watch('address')) {
            setValue('address', dr.shippingAddress);
          }
          if (dr.whatsappNumber && !watch('phone')) {
            setValue('phone', dr.whatsappNumber);
          }
        }
        
        const settingsRes = await api.get('/settings');
        if (settingsRes.data?.success) {
          const s = settingsRes.data.data;
          if (s.points_exchange_rate && !isNaN(Number(s.points_exchange_rate))) {
            setExchangeRate(Number(s.points_exchange_rate));
          }
          if (s.max_points_discount_percentage && !isNaN(Number(s.max_points_discount_percentage))) {
            setMaxDiscountPercent(Number(s.max_points_discount_percentage));
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || t('errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    };
    fetchOrderData();
  }, [id, t, setValue, watch]);

  const handleFetchRates = async () => {
    if (deliveryType === 'PICKUP') return;
    
    const currentValues = watch();
    if (!currentValues.postalCode) {
      toast.error('Silakan isi kode pos terlebih dahulu untuk mengecek ongkir.');
      return;
    }

    setFetchingRates(true);
    setShippingError(null);
    setSelectedShipping(null);
    
    try {
      // Create items array using productTypeForSablon as productName
      const items = (requestData?.designRequests || []).map(dr => ({
        productName: dr.productTypeForSablon,
        quantity: dr.quantity || 1
      }));
      
      const res = await api.post('/orders/shipping-rates', {
        destinationPostalCode: currentValues.postalCode,
        weight: 0, // let backend calculate
        items: items
      });
      
      const rates = res.data?.data?.pricing || [];
      setShippingRates(rates);
    } catch (err) {
      console.error('Failed to fetch shipping rates', err);
      setShippingError(err.response?.data?.message || 'Gagal mengambil tarif pengiriman');
    } finally {
      setFetchingRates(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error(t('errors.loginRequired'));
      navigate('/login?redirect=/checkout-sablon/' + id);
      return;
    }
    
    if (deliveryType === 'SHIPPING' && !selectedShipping) {
      toast.error('Pilih kurir pengiriman terlebih dahulu');
      return;
    }
    
    setProcessing(true);
    try {
      const addressData = watch();
      const res = await api.post(`/orders/custom-sablon/${id}/pay`, {
        paymentMethod,
        usePoints,
        paymentType,
        deliveryType,
        deliveryAddress: deliveryType === 'PICKUP' ? null : {
          fullName: `${addressData.firstName} ${addressData.lastName}`.trim(),
          addressLine1: addressData.address,
          city: addressData.city,
          postalCode: addressData.postalCode,
          phone: addressData.phone,
          email: addressData.email
        },
        shippingCourier: deliveryType === 'PICKUP' ? 'SELF_PICKUP' : `${selectedShipping.courier_name} - ${selectedShipping.courier_service_name}`,
        shippingCost: deliveryType === 'PICKUP' ? 0 : selectedShipping.price,
      });
      if (res.data.data?.paymentUrl) {
        window.location.href = res.data.data.paymentUrl;
      } else {
        toast.success('Berhasil membuat tagihan');
        navigate(`/order-tracking/${id}`);
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

  const estimatedTotal = Number(requestData.totalPrice || requestData.totalAmount || 0);
  const dpAmount = Math.ceil(estimatedTotal / 2);
  const selectedAmount = paymentType === 'FULL' ? estimatedTotal : dpAmount;
  
  let estimatedWeight = 350; // buffer
  if (requestData?.designRequests) {
    requestData.designRequests.forEach(dr => {
      let weight = 250;
      if (dr.productTypeForSablon) {
        const nameStr = dr.productTypeForSablon.toLowerCase();
        if (nameStr.includes('topi')) weight = 100;
        else if (nameStr.includes('tas') || nameStr.includes('spunbond') || nameStr.includes('tote') || nameStr.includes('goodie')) weight = 150;
        else if (nameStr.includes('lanyard') || nameStr.includes('id card')) weight = 50;
        else if (nameStr.includes('jaket') || nameStr.includes('hoodie') || nameStr.includes('sweater')) weight = 500;
      }
      estimatedWeight += weight * (dr.quantity || 1);
    });
  }
  
  let pointsDiscount = 0;
  let finalAmount = selectedAmount;
  let pointsValue = 0;
  if (usePoints && user && user.rewardPoints > 0) {
    pointsValue = user.rewardPoints * exchangeRate;
    const maxAllowed = Math.floor(finalAmount * (maxDiscountPercent / 100));
    if (pointsValue > maxAllowed) {
      pointsDiscount = maxAllowed;
    } else if (pointsValue > finalAmount) {
      pointsDiscount = finalAmount;
    } else {
      pointsDiscount = pointsValue;
    }
    finalAmount -= pointsDiscount;
  }

  // Add shipping cost
  if (deliveryType === 'SHIPPING' && selectedShipping) {
    finalAmount += selectedShipping.price;
  }

  return (
    <PageTransition>
      <SEOHead title={`${t('title')} - Arianation`} description={t('title')} />
      <div className="min-h-screen bg-white dark:bg-black py-16 pt-28 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-display font-black tracking-tighter mb-8 dark:text-white uppercase">Checkout Sablon</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              
              {/* Ringkasan Desain (Bisa multiple) */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 uppercase tracking-widest text-sm">{t('designSummary', { defaultValue: 'Ringkasan Final Desain' })}</h3>
                
                {requestData.designRequests && requestData.designRequests.length > 0 ? (
                  <div className="space-y-4">
                    {requestData.designRequests.map((design, index) => (
                      <div key={design.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6 last:border-0 last:pb-0 last:mb-0 flex gap-4">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                          {design.mockupPreviewUrl || design.designFileUrl ? (
                            <img src={design.mockupPreviewUrl || design.designFileUrl} alt={design.designTitle} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">#{index + 1} - {design.designTitle}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            <p><span className="font-semibold text-gray-800 dark:text-gray-300">Warna Produk:</span> {design.colorPreferences}</p>
                            <p><span className="font-semibold text-gray-800 dark:text-gray-300">Total Qty:</span> {design.quantity} Pcs</p>
                            
                            <p><span className="font-semibold text-gray-800 dark:text-gray-300">Teknik:</span> {design.printTechnique}</p>
                            <p><span className="font-semibold text-gray-800 dark:text-gray-300">Posisi:</span> {design.printPosition}</p>
                            
                            <p><span className="font-semibold text-gray-800 dark:text-gray-300">Ukuran Sablon:</span> {design.printSize}</p>
                            <p><span className="font-semibold text-gray-800 dark:text-gray-300">Ukuran Baju/Tas:</span> {design.sizeBreakdown}</p>
                            
                            <p className="col-span-1 md:col-span-2 pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
                              <span className="font-semibold text-gray-800 dark:text-gray-300">Harga Disetujui:</span> <span className="text-aria-maroon dark:text-amber-400 font-bold">Rp {Number(design.estimatedPrice || 0).toLocaleString('id-ID')}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Menunggu detail desain...</p>
                )}
              </div>

              {/* Shipping Section */}
              <div className="bg-white dark:bg-black p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 uppercase tracking-widest text-sm">Metode Pengiriman</h3>
                <div className="flex gap-4 mb-6">
                  <button type="button" onClick={() => { setDeliveryType('SHIPPING'); setSelectedShipping(null); }} className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors rounded-xl ${deliveryType === 'SHIPPING' ? 'border-2 border-aria-charcoal dark:border-white bg-gray-50 dark:bg-gray-900 text-aria-charcoal dark:text-white' : 'border border-gray-200 dark:border-gray-800 text-gray-500 hover:border-aria-charcoal dark:hover:border-white'}`}>Kirim Ke Alamat</button>
                  <button type="button" onClick={() => { 
                    setDeliveryType('PICKUP'); 
                    setSelectedShipping({ price: 0, courier_name: 'Ambil di Toko', courier_service_code: 'SELF_PICKUP' }); 
                  }} className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors rounded-xl ${deliveryType === 'PICKUP' ? 'border-2 border-aria-charcoal dark:border-white bg-gray-50 dark:bg-gray-900 text-aria-charcoal dark:text-white' : 'border border-gray-200 dark:border-gray-800 text-gray-500 hover:border-aria-charcoal dark:hover:border-white'}`}>Ambil Di Toko</button>
                </div>
                
                {deliveryType === 'SHIPPING' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total Berat Paket Aktual</p>
                      <p className="text-sm font-semibold text-aria-charcoal dark:text-white">{estimatedWeight.toLocaleString('id-ID')} Gram <span className="font-normal text-gray-400">({(estimatedWeight/1000).toFixed(1)} Kg)</span></p>
                    </div>
                    <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">Nama Depan</label>
                        <input {...register('firstName')} className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white bg-transparent transition-colors dark:text-white" />
                        {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">Nama Belakang</label>
                        <input {...register('lastName')} className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white bg-transparent transition-colors dark:text-white" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">Email</label>
                        <input {...register('email')} type="email" className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white bg-transparent transition-colors dark:text-white" />
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">Nomor Telepon (WhatsApp)</label>
                        <input {...register('phone')} type="tel" className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white bg-transparent transition-colors dark:text-white" />
                        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">Alamat Lengkap</label>
                        <input {...register('address')} type="text" className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white bg-transparent transition-colors dark:text-white" />
                        {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">Kota</label>
                        <input {...register('city')} type="text" className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white bg-transparent transition-colors dark:text-white" />
                        {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">Kode Pos</label>
                        <div className="flex gap-2">
                          <input {...register('postalCode')} type="text" className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white bg-transparent transition-colors dark:text-white" />
                          <button type="button" onClick={handleFetchRates} disabled={fetchingRates} className="bg-aria-charcoal text-white rounded-lg px-4 text-xs font-bold uppercase tracking-widest hover:bg-black disabled:opacity-50">
                            Cek
                          </button>
                        </div>
                        {errors.postalCode && <p className="text-xs text-red-500 mt-1">{errors.postalCode.message}</p>}
                      </div>
                    </form>

                    {fetchingRates ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aria-charcoal dark:border-white"></div>
                      </div>
                    ) : shippingError ? (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mt-4">
                        <p className="text-sm text-red-600">{shippingError}</p>
                      </div>
                    ) : shippingRates.length > 0 ? (
                      <div className="mt-6">
                        <ShippingMethodSelector 
                          deliveryType={deliveryType}
                          onChangeType={() => {}} // Not used here
                          shippingCost={selectedShipping?.price || 0}
                          shippingCourier={selectedShipping ? `${selectedShipping.courier_name}-${selectedShipping.courier_service_code}` : null}
                          onCourierSelect={(c) => setSelectedShipping(c)}
                          couriers={shippingRates}
                          isSablonOrder={false} 
                        />
                      </div>
                    ) : null}
                  </div>
                )}
                {deliveryType === 'PICKUP' && (
                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-amber-800">
                    <p className="text-sm">Anda memilih Ambil di Toko. Barang dapat diambil di Gudang Arianation pada jam kerja setelah status pesanan berubah menjadi Selesai Produksi.</p>
                  </div>
                )}
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
                        <h4 className="font-bold text-gray-800 dark:text-white">{t('fullPayment', { defaultValue: 'Bayar Lunas 100%' })}</h4>
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
                        <h4 className="font-bold text-gray-800 dark:text-white">{t('dpPayment', { defaultValue: 'Bayar DP 50%' })}</h4>
                        <span className="font-bold text-aria-maroon dark:text-amber-400">Rp {dpAmount.toLocaleString('id-ID')}</span>
                      </div>
                      <p className="text-xs text-gray-500">{t('dpPaymentDesc')}</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Point Redemption */}
              {user && user.rewardPoints > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex items-start justify-between border border-gray-200 dark:border-gray-700">
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white text-sm">{t('usePoints')}</h3>
                    <p className="text-xs text-gray-500 mt-1">{t('youHavePoints', { points: user.rewardPoints, value: (user.rewardPoints * exchangeRate).toLocaleString('id-ID') })}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-aria-maroon"></div>
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
                    <div className="flex justify-between items-center text-red-500 font-medium">
                      <span>{t('pointsDiscount')}</span>
                      <span>- Rp {pointsDiscount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {usePoints && pointsValue > Math.floor(selectedAmount * (maxDiscountPercent / 100)) && (
                    <div className="flex justify-end">
                      <span className="text-[10px] text-gray-500 italic text-right">
                        Maksimal diskon poin {maxDiscountPercent}%
                      </span>
                    </div>
                  )}
                  
                  {deliveryType === 'SHIPPING' && selectedShipping && (
                    <div className="flex justify-between text-aria-charcoal dark:text-white">
                      <span>Ongkos Kirim ({selectedShipping.courier_name})</span>
                      <span>+ Rp {selectedShipping.price.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  
                  <div className="h-px bg-gray-200 dark:bg-gray-800 my-4" />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 dark:text-white">{t('totalBilled')}</span>
                    <span className="font-black text-xl text-aria-maroon dark:text-amber-400">Rp {finalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      Dengan melanjutkan pembayaran, Anda menyetujui <span className="font-bold text-gray-700 dark:text-gray-300">Syarat & Ketentuan layanan Arianation</span>, dan pesanan yang sudah diproses <span className="font-bold text-gray-700 dark:text-gray-300">tidak dapat diubah</span>.
                    </p>
                  </div>

                <button
                  onClick={handleSubmit(handleCheckout)}
                  disabled={processing || (deliveryType === 'SHIPPING' && !selectedShipping)}
                  className="w-full py-4 bg-aria-charcoal dark:bg-white text-white dark:text-aria-charcoal rounded-xl text-sm font-black tracking-widest uppercase hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? t('processing') : t('payNow')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

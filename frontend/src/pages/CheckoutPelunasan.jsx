import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';
import api from '../services/api';
import { toast } from 'react-toastify';
import SEOHead from '../components/SEOHead';
import Breadcrumb from '../components/Breadcrumb';
import ShippingMethodSelector from '../components/checkout/ShippingMethodSelector';

const addressSchema = z.object({
  firstName: z.string().min(2, 'Min 2 characters'),
  lastName: z.string().min(2, 'Min 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Min 10 digits'),
  address: z.string().min(5, 'Min 5 characters'),
  city: z.string().min(2, 'Min 2 characters'),
  postalCode: z.string().min(4, 'Min 4 digits'),
  country: z.string().default('INDONESIA'),
});

export default function CheckoutPelunasan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { setLoading } = useUIStore();
  
  const [order, setOrder] = useState(null);
  const [step, setStep] = useState(1); // 1: Address, 2: Shipping, 3: Payment
  const [fetchingRates, setFetchingRates] = useState(false);
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [shippingError, setShippingError] = useState(null);
  const [orderError, setOrderError] = useState(null);
  const [totalPaid, setTotalPaid] = useState(0);
  const [deliveryType, setDeliveryType] = useState('SHIPPING');

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      country: 'INDONESIA',
      email: user?.email || '',
      firstName: user?.fullName?.split(' ')[0] || '',
      lastName: user?.fullName?.split(' ').slice(1).join(' ') || '',
    },
  });

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

  const handleAddressSubmit = async (data) => {
    setFetchingRates(true);
    setShippingError(null);
    setSelectedShipping(null);
    setStep(2);
    
    try {
      const estimatedWeight = order?.actualWeight || 3000;
      
      const res = await api.post('/orders/shipping-rates', {
        destinationPostalCode: data.postalCode,
        weight: estimatedWeight
      });
      
      const rates = res.data?.data?.pricing || [];
      setShippingRates(rates);
    } catch (err) {
      console.error('Failed to fetch shipping rates', err);
      setShippingError(err.response?.data?.message || 'Gagal mengambil tarif pengiriman.');
    } finally {
      setFetchingRates(false);
    }
  };

  const processPayment = async () => {
    if (!selectedShipping) return;
    
    setOrderError(null);
    try {
      setLoading(true);
      const addressData = watch();
      
      const payload = {
        deliveryType,
        shippingCourier: selectedShipping.courier_service_code === 'SELF_PICKUP' ? null : `${selectedShipping.courier_name} - ${selectedShipping.courier_service_name}`,
        shippingCost: selectedShipping.price,
        deliveryAddress: {
          fullName: `${addressData.firstName || user?.fullName || 'Customer'} ${addressData.lastName || ''}`.trim(),
          email: addressData.email || user?.email || 'customer@example.com',
          phone: addressData.phone || user?.phone || '081234567890',
          addressLine1: addressData.address || 'Gudang',
          city: addressData.city || 'Malang',
          postalCode: addressData.postalCode || '12345',
        }
      };

      const res = await api.post(`/orders/${id}/pelunasan`, payload);
      
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

  // To display the remaining amount, we need to know the initial estimated price or just wait for the backend to generate the invoice.
  // We can fetch design request if we need it, but let's just display the calculation we get from the order.
  // Note: we will need to fix the backend bug first!

  return (
    <>
      <SEOHead title="Checkout Pelunasan - Arianation" description="Pelunasan pesanan Custom Sablon" />
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 mt-6 mb-24">
        <Breadcrumb />
        
        <h1 className="text-4xl font-display font-medium uppercase tracking-tight text-aria-charcoal dark:text-white mb-10 mt-6">
          Pelunasan Custom Sablon
        </h1>

        <div className="flex gap-4 mb-12 text-xs font-semibold tracking-widest uppercase border-b border-gray-200 dark:border-gray-800 pb-4">
          <span className={step === 1 ? 'text-aria-charcoal dark:text-white' : 'text-gray-400 dark:text-gray-600'}>01. Shipping Details</span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span className={step === 2 ? 'text-aria-charcoal dark:text-white' : 'text-gray-400 dark:text-gray-600'}>02. Select Courier</span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span className={step === 3 ? 'text-aria-charcoal dark:text-white' : 'text-gray-400 dark:text-gray-600'}>03. Payment</span>
        </div>

        <motion.div key={step} initial="hidden" animate="visible" variants={fadeUp}>
          {step === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-lg font-medium tracking-widest uppercase mb-8 pb-4 border-b border-gray-200 dark:border-gray-800 dark:text-white">Alamat Pengiriman</h2>
                
                <div className="flex gap-4 mb-8">
                  <button type="button" onClick={() => { setDeliveryType('SHIPPING'); setSelectedShipping(null); }} className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${deliveryType === 'SHIPPING' ? 'border-2 border-aria-charcoal dark:border-white bg-gray-50 dark:bg-gray-900 text-aria-charcoal dark:text-white' : 'border border-gray-200 dark:border-gray-800 text-gray-500 hover:border-aria-charcoal dark:hover:border-white'}`}>🚚 Kirim ke Alamat</button>
                  <button type="button" onClick={() => { 
                    setDeliveryType('PICKUP'); 
                    setSelectedShipping({ price: 0, courier_name: 'Ambil di Toko', courier_service_code: 'SELF_PICKUP' }); 
                  }} className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${deliveryType === 'PICKUP' ? 'border-2 border-aria-charcoal dark:border-white bg-gray-50 dark:bg-gray-900 text-aria-charcoal dark:text-white' : 'border border-gray-200 dark:border-gray-800 text-gray-500 hover:border-aria-charcoal dark:hover:border-white'}`}>🏪 Ambil di Toko</button>
                </div>

                {deliveryType === 'SHIPPING' ? (
                <form id="shipping-form" onSubmit={handleSubmit(handleAddressSubmit)} className="space-y-6">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">First Name</label>
                      <input {...register('firstName')} className="w-full border border-gray-300 dark:border-gray-700 p-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white bg-transparent transition-colors dark:text-white" />
                      {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">Last Name</label>
                      <input {...register('lastName')} className="w-full border border-gray-300 dark:border-gray-700 p-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white bg-transparent transition-colors dark:text-white" />
                      {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">Email</label>
                    <input {...register('email')} type="email" className="w-full border border-gray-300 dark:border-gray-700 p-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white bg-transparent transition-colors dark:text-white" />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">Phone</label>
                    <input {...register('phone')} type="tel" className="w-full border border-gray-300 dark:border-gray-700 p-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white bg-transparent transition-colors dark:text-white" />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">Address</label>
                    <input {...register('address')} type="text" className="w-full border border-gray-300 dark:border-gray-700 p-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white bg-transparent transition-colors dark:text-white" />
                    {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">Country</label>
                      <select {...register('country')} className="w-full border border-gray-300 dark:border-gray-700 p-3 text-sm bg-transparent dark:text-white focus:outline-none focus:border-aria-charcoal dark:focus:border-white transition-colors appearance-none">
                        <option value="INDONESIA" className="dark:text-black">Indonesia</option>
                      </select>
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">City</label>
                      <input {...register('city')} type="text" className="w-full border border-gray-300 dark:border-gray-700 p-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white bg-transparent transition-colors dark:text-white" />
                      {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">Zip</label>
                      <input {...register('postalCode')} type="text" className="w-full border border-gray-300 dark:border-gray-700 p-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white bg-transparent transition-colors dark:text-white" />
                      {errors.postalCode && <p className="text-xs text-red-500 mt-1">{errors.postalCode.message}</p>}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="submit" form="shipping-form" className="w-full bg-aria-charcoal dark:bg-white text-white dark:text-black py-4 text-sm font-medium tracking-widest uppercase hover:bg-aria-maroon transition-colors">
                      Continue to Shipping
                    </button>
                  </div>
                </form>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-amber-50 border border-amber-200 p-6 rounded text-amber-800">
                      <p className="text-sm">Anda memilih untuk mengambil pesanan sendiri di gudang kami. Anda tidak perlu mengisi alamat pengiriman.</p>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setStep(2)} className="w-full bg-aria-charcoal dark:bg-white text-white dark:text-black py-4 text-sm font-medium tracking-widest uppercase hover:bg-aria-maroon transition-colors">
                        Continue to Shipping
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary Sidebar */}
              {order && (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 self-start border border-gray-200 dark:border-gray-800">
                  <h3 className="text-sm font-medium tracking-widest uppercase mb-4 pb-4 border-b border-gray-200 dark:border-gray-800 dark:text-white">Order Summary</h3>
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-gray-600 dark:text-gray-400">Total Biaya Produksi</span>
                    <span className="font-medium text-aria-charcoal dark:text-white">Rp {order.designRequest?.estimatedPrice?.toLocaleString('id-ID') || order.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 pt-2 pb-4 border-b border-gray-200 dark:border-gray-800">
                    <span>DP Dibayarkan</span>
                    <span>- Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold uppercase tracking-widest pt-4 dark:text-white">
                    <span>Sisa Tagihan</span>
                    <span>Rp {((order.designRequest?.estimatedPrice || order.totalAmount) - order.totalAmount).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-lg font-medium tracking-widest uppercase mb-8 pb-4 border-b border-gray-200 dark:border-gray-800 dark:text-white">Shipping Method</h2>
                
                {fetchingRates ? (
                  <div className="flex flex-col items-center justify-center p-8 space-y-4">
                    <div className="w-8 h-8 border-2 border-aria-charcoal dark:border-white border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-medium tracking-widest uppercase text-gray-500">Mencari kurir terbaik...</p>
                  </div>
                ) : shippingError ? (
                  <div className="border border-red-200 bg-red-50 dark:bg-red-900/20 p-6 mb-6 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400 mb-4">{shippingError}</p>
                    <button onClick={() => handleAddressSubmit(watch())} className="bg-red-600 text-white px-6 py-3 text-xs font-semibold tracking-widest uppercase hover:bg-red-700">
                      Coba Lagi
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-8">
                      <ShippingMethodSelector 
                        deliveryType={deliveryType}
                        onChangeType={(type) => {
                          setDeliveryType(type);
                          if (type === 'PICKUP') {
                            setSelectedShipping({ price: 0, courier_name: 'Ambil di Toko', courier_service_code: 'SELF_PICKUP' });
                          } else {
                            setSelectedShipping(null);
                          }
                        }}
                        shippingCost={selectedShipping?.price || 0}
                        shippingCourier={selectedShipping?.courier_service_code}
                        onCourierSelect={(c) => setSelectedShipping(c)}
                        couriers={shippingRates}
                        isSablonOrder={false}
                      />
                    </div>
                    
                    <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                      <button type="button" onClick={() => setStep(1)} className="w-1/3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-4 text-sm font-medium tracking-widest uppercase hover:border-aria-charcoal dark:hover:border-white transition-colors">
                        Back
                      </button>
                      <button 
                        onClick={() => setStep(3)}
                        disabled={!selectedShipping}
                        className="w-2/3 bg-aria-charcoal dark:bg-white text-white dark:text-black py-4 text-sm font-medium tracking-widest uppercase hover:bg-aria-maroon transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Order Summary Sidebar */}
              {order && (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 self-start border border-gray-200 dark:border-gray-800">
                  <h3 className="text-sm font-medium tracking-widest uppercase mb-4 pb-4 border-b border-gray-200 dark:border-gray-800 dark:text-white">Order Summary</h3>
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-gray-600 dark:text-gray-400">Total Biaya Produksi</span>
                    <span className="font-medium text-aria-charcoal dark:text-white">Rp {order.designRequest?.estimatedPrice?.toLocaleString('id-ID') || order.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 pt-2 pb-4 border-b border-gray-200 dark:border-gray-800">
                    <span>DP Dibayarkan</span>
                    <span>- Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  
                  {selectedShipping && (
                    <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-aria-charcoal dark:text-white pt-4 pb-2 border-b border-gray-200 dark:border-gray-800">
                      <span>Ongkos Kirim ({selectedShipping.courier_name})</span>
                      <span>+ Rp {selectedShipping.price.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-base font-semibold uppercase tracking-widest pt-4 dark:text-white">
                    <span>Total Pelunasan</span>
                    <span>Rp {(((order.designRequest?.estimatedPrice || order.totalAmount) - order.totalAmount) + (selectedShipping ? selectedShipping.price : 0)).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-lg font-medium tracking-widest uppercase mb-8 pb-4 border-b border-gray-200 dark:border-gray-800 dark:text-white">Payment</h2>
                
                <div className="mb-8 border border-gray-200 dark:border-gray-800 p-6 dark:bg-black">
                  <h3 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-4">
                    {deliveryType === 'PICKUP' ? 'Metode Pengiriman' : 'Shipping To'}
                  </h3>
                  {deliveryType === 'PICKUP' ? (
                     <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed uppercase tracking-wide">
                        AMBIL DI TOKO (SELF PICKUP)<br/>
                        Gudang Arianation
                     </p>
                  ) : (
                    <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed uppercase tracking-wide">
                      {watch('firstName')} {watch('lastName')}<br/>
                      {watch('address')}<br/>
                      {watch('city')}, {watch('postalCode')}<br/>
                      {watch('country')}<br/>
                      {watch('phone')} | {watch('email')}
                    </p>
                  )}
                  <button onClick={() => setStep(1)} className="mt-4 text-xs font-semibold tracking-widest uppercase text-aria-charcoal dark:text-white underline underline-offset-4">
                    Edit Details
                  </button>
                </div>

                <div className="mb-8 border border-aria-charcoal dark:border-white p-6 relative overflow-hidden dark:bg-black">
                  <div className="absolute top-0 right-0 bg-aria-charcoal dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest px-3 py-1">Selected</div>
                  <h3 className="text-sm font-semibold tracking-widest uppercase text-aria-charcoal dark:text-white mb-2">Xendit Secure Payment</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-wider">
                    Tagihan pelunasan ini akan digenerate melalui Xendit. Anda dapat membayar menggunakan Virtual Account, QRIS, e-Wallets, atau Credit Card.
                  </p>
                </div>

                {orderError && (
                  <div className="mb-6 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400">{orderError}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(2)} className="w-1/3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-4 text-sm font-medium tracking-widest uppercase hover:border-aria-charcoal dark:hover:border-white transition-colors">
                    Back
                  </button>
                  <button onClick={processPayment} disabled={!selectedShipping} className="w-2/3 bg-aria-charcoal dark:bg-white text-white dark:text-black py-4 text-sm font-medium tracking-widest uppercase hover:bg-aria-maroon transition-colors disabled:opacity-50">
                    Bayar Pelunasan
                  </button>
                </div>
              </div>

              {/* Order Summary Sidebar */}
              {order && selectedShipping && (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 self-start border border-gray-200 dark:border-gray-800">
                  <h3 className="text-sm font-medium tracking-widest uppercase mb-4 pb-4 border-b border-gray-200 dark:border-gray-800 dark:text-white">Order Summary</h3>
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-gray-600 dark:text-gray-400">Total Biaya Produksi</span>
                    <span className="font-medium text-aria-charcoal dark:text-white">Rp {order.designRequest?.estimatedPrice?.toLocaleString('id-ID') || order.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 pt-2 pb-4 border-b border-gray-200 dark:border-gray-800">
                    <span>DP Dibayarkan</span>
                    <span>- Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-aria-charcoal dark:text-white pt-4 pb-2 border-b border-gray-200 dark:border-gray-800">
                    <span>Ongkos Kirim ({selectedShipping.courier_name})</span>
                    <span>+ Rp {selectedShipping.price.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex justify-between text-lg font-bold uppercase tracking-widest pt-4 dark:text-white text-aria-charcoal">
                    <span>Total Pelunasan</span>
                    <span>Rp {(((order.designRequest?.estimatedPrice || order.totalAmount) - order.totalAmount) + selectedShipping.price).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}

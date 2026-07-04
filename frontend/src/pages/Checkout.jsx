import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import useUIStore from '../store/uiStore';
import api from '../services/api';
import SEOHead from '../components/SEOHead';
import Breadcrumb from '../components/Breadcrumb';

const CHECKOUT_TRANSLATIONS = {
  ID: {
    confirmed: 'Pesanan Berhasil Dibuat',
    orderId: 'ID Pesanan:',
    desc: 'Terima kasih atas pesanan Anda. Silakan lanjut ke halaman pelacakan untuk melihat instruksi pembayaran agar barang Anda segera kami proses.',
    btn: 'Lacak Pesanan & Bayar'
  },
  EN: {
    confirmed: 'Order Confirmed',
    orderId: 'Order ID:',
    desc: 'Thank you for your purchase. Please proceed to the tracking page to view payment instructions so we can process your items as soon as possible.',
    btn: 'Track Order & Pay'
  }
};

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

export default function Checkout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const language = useUIStore((s) => s.language) || 'ID';
  const t = CHECKOUT_TRANSLATIONS[language];
  const cartItems = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const setLoading = useUIStore((s) => s.setLoading);
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Choose, 2: Address, 3: Review, 4: Success
  const [checkoutType, setCheckoutType] = useState(null);
  const [orderError, setOrderError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [usePoints, setUsePoints] = useState(false);
  const [profile, setProfile] = useState(null);
  const pointsValue = user?.rewardPoints ? user.rewardPoints * 1000 : 0;

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/auth/me')
        .then(res => setProfile(res.data?.data))
        .catch(err => console.error('Failed to fetch profile', err));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Dynamically load Midtrans Snap script
    const snapScriptUrl = 'https://app.sandbox.midtrans.com/snap/snap.js';
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
    
    let script = document.querySelector(`script[src="${snapScriptUrl}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = snapScriptUrl;
      script.setAttribute('data-client-key', clientKey);
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

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
    if (!cartItems.length && step > 1 && step < 4) {
      navigate('/');
    }
  }, [cartItems.length, step, navigate]);

  useEffect(() => {
    if (isAuthenticated && step === 1) {
      setCheckoutType('account');
      setStep(2);
    }
  }, [isAuthenticated, step]);

  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [activeVouchers, setActiveVouchers] = useState([]);

  useEffect(() => {
    api.get('/vouchers/active')
      .then(res => {
        if (res.data?.success) {
          setActiveVouchers(res.data.data || []);
        }
      })
      .catch(err => console.error('Failed to fetch active vouchers:', err));
  }, []);

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  let tierDiscountPercentage = 0;
  if (profile?.currentTier === 'SILVER') tierDiscountPercentage = 5;
  else if (profile?.currentTier === 'GOLD') tierDiscountPercentage = 10;
  else if (profile?.currentTier === 'PLATINUM') tierDiscountPercentage = 15;

  const tierDiscountAmount = Math.floor(cartTotal * (tierDiscountPercentage / 100));
  let finalTotal = Math.max(0, cartTotal - tierDiscountAmount);
  
  let voucherDiscountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.type === 'PERCENTAGE') {
      voucherDiscountAmount = Math.floor(finalTotal * (appliedVoucher.value / 100));
      if (appliedVoucher.maxDiscount > 0 && voucherDiscountAmount > appliedVoucher.maxDiscount) {
        voucherDiscountAmount = appliedVoucher.maxDiscount;
      }
    } else {
      voucherDiscountAmount = appliedVoucher.value;
    }
    
    if (voucherDiscountAmount > finalTotal) {
      voucherDiscountAmount = finalTotal;
    }
    finalTotal -= voucherDiscountAmount;
  }

  const subtotalAfterTierAndVoucher = finalTotal;

  let pointsDeducted = 0;
  if (usePoints) {
    if (pointsValue > finalTotal) {
      pointsDeducted = finalTotal;
    } else {
      pointsDeducted = pointsValue;
    }
    finalTotal = Math.max(0, finalTotal - pointsDeducted);
  }

  const handleApplyVoucher = async (codeToApply) => {
    const code = typeof codeToApply === 'string' ? codeToApply : voucherInput;
    if (!code) return;
    
    setVoucherInput(code); // update visual input
    setVoucherLoading(true);
    setVoucherError('');
    try {
      const res = await api.post('/vouchers/validate', {
        code: code.trim(),
        subtotal: Math.max(0, cartTotal - tierDiscountAmount),
        userId: user?.id
      });
      setAppliedVoucher(res.data.data);
      setVoucherInput('');
    } catch (err) {
      setVoucherError(err.response?.data?.message || 'Kode voucher tidak valid');
      setAppliedVoucher(null);
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput('');
    setVoucherError('');
  };

  if (!cartItems.length && step === 1) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-medium tracking-widest uppercase mb-4 text-gray-500">Your bag is empty</h2>
        <Link to="/products" className="inline-block border border-aria-charcoal px-8 py-4 text-sm font-medium uppercase tracking-[0.15em] hover:bg-aria-charcoal hover:text-white transition-colors">
          Continue Shopping
        </Link>
      </div>
    );
  }

  // Animation variants
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <>
      <SEOHead title="Checkout - Arianation" description="Complete your purchase." />
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 mt-6 mb-24">
        <Breadcrumb />
        
        <h1 className="text-4xl font-display font-medium uppercase tracking-tight text-aria-charcoal dark:text-white mb-10 mt-6">
          Checkout
        </h1>

        {/* Step Indicator */}
        {step < 4 && (
          <div className="flex gap-4 mb-12 text-xs font-semibold tracking-widest uppercase border-b border-gray-200 dark:border-gray-800 pb-4">
            <span className={step === 1 ? 'text-aria-charcoal dark:text-white' : 'text-gray-400 dark:text-gray-600'}>01. Account</span>
            <span className="text-gray-300 dark:text-gray-700">/</span>
            <span className={step === 2 ? 'text-aria-charcoal dark:text-white' : 'text-gray-400 dark:text-gray-600'}>02. Shipping</span>
            <span className="text-gray-300 dark:text-gray-700">/</span>
            <span className={step === 3 ? 'text-aria-charcoal dark:text-white' : 'text-gray-400 dark:text-gray-600'}>03. Payment</span>
          </div>
        )}

        <motion.div
          key={step}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          {/* Step 1: Authentication Choice */}
          {step === 1 && (
            <div className="max-w-md mx-auto mt-8 border border-gray-200 dark:border-gray-800 p-8 dark:bg-black">
              <h2 className="text-lg font-medium tracking-widest uppercase mb-8 text-center dark:text-white">Account</h2>
              
              {isAuthenticated ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">Signed in as <strong className="text-aria-charcoal dark:text-white">{user?.email}</strong></p>
                  <button
                    onClick={() => { setCheckoutType('account'); setStep(2); }}
                    className="w-full bg-aria-charcoal text-white dark:bg-white dark:text-black py-4 text-sm font-medium tracking-[0.15em] uppercase hover:bg-aria-maroon transition-colors"
                  >
                    Continue as {user?.fullName}
                  </button>
                  <button
                    onClick={() => { setCheckoutType('guest'); setStep(2); }}
                    className="w-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-4 text-sm font-medium tracking-[0.15em] uppercase hover:border-aria-charcoal dark:hover:border-white transition-colors"
                  >
                    Checkout as Guest
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => navigate('/login?redirect=/checkout')}
                    className="w-full bg-aria-charcoal text-white dark:bg-white dark:text-black py-4 text-sm font-medium tracking-[0.15em] uppercase hover:bg-aria-maroon transition-colors"
                  >
                    Sign In
                  </button>
                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800"></div></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-white dark:bg-black px-4 text-gray-400 uppercase tracking-widest">Or</span></div>
                  </div>
                  <button
                    onClick={() => { setCheckoutType('guest'); setStep(2); }}
                    className="w-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-4 text-sm font-medium tracking-[0.15em] uppercase hover:border-aria-charcoal dark:hover:border-white transition-colors"
                  >
                    Checkout as Guest
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Shipping Form */}
          {step === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-lg font-medium tracking-widest uppercase mb-8 pb-4 border-b border-gray-200 dark:border-gray-800 dark:text-white">Shipping Details</h2>
                <form id="shipping-form" onSubmit={handleSubmit(() => setStep(3))} className="space-y-6">
                  
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
                    <button type="button" onClick={() => {
                      if (isAuthenticated) {
                        navigate('/cart');
                      } else {
                        setStep(1);
                      }
                    }} className="w-1/3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-4 text-sm font-medium tracking-widest uppercase hover:border-aria-charcoal dark:hover:border-white transition-colors">
                      Back
                    </button>
                    <button type="submit" form="shipping-form" className="w-2/3 bg-aria-charcoal dark:bg-white text-white dark:text-black py-4 text-sm font-medium tracking-widest uppercase hover:bg-aria-maroon transition-colors">
                      Continue
                    </button>
                  </div>
                </form>
              </div>
              
              {/* Cart Summary sidebar */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-6 self-start border border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-medium tracking-widest uppercase mb-4 pb-4 border-b border-gray-200 dark:border-gray-800 dark:text-white">Order Summary</h3>
                <div className="space-y-4 mb-4">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 truncate mr-4">{item.quantity}x {item.productName}</span>
                      <span className="font-medium text-aria-charcoal dark:text-white">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-base font-semibold uppercase tracking-widest border-t border-gray-200 dark:border-gray-800 pt-4 dark:text-white">
                  <span>Subtotal</span>
                  <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
                </div>
                {tierDiscountAmount > 0 && (
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 pt-2">
                    <span>{profile?.currentTier} TIER DISCOUNT ({tierDiscountPercentage}%)</span>
                    <span>- Rp {tierDiscountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {appliedVoucher && (
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 pt-2">
                    <span className="flex items-center gap-2">
                      VOUCHER: {appliedVoucher.code}
                      <button onClick={handleRemoveVoucher} className="text-gray-400 hover:text-red-500 text-[10px] underline">Remove</button>
                    </span>
                    <span>- Rp {voucherDiscountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {usePoints && (
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-aria-maroon dark:text-yellow-400 pt-2">
                    <span>Aria Points</span>
                    <span>- Rp {pointsDeducted.toLocaleString('id-ID')}</span>
                  </div>
                )}
                
                {/* Voucher Input */}
                {!appliedVoucher && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Voucher Code" 
                        value={voucherInput}
                        onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                        className="flex-1 border border-gray-300 dark:border-gray-700 p-2 text-sm bg-transparent dark:text-white uppercase focus:outline-none focus:border-aria-charcoal dark:focus:border-white"
                      />
                      <button 
                        type="button"
                        onClick={handleApplyVoucher}
                        disabled={voucherLoading || !voucherInput.trim()}
                        className="bg-aria-charcoal text-white dark:bg-white dark:text-black px-4 py-2 text-xs font-semibold tracking-widest uppercase disabled:opacity-50"
                      >
                        {voucherLoading ? 'Wait' : 'Apply'}
                      </button>
                    </div>
                    {voucherError && <p className="text-red-500 text-xs mt-2 font-medium">{voucherError}</p>}
                    
                    {/* Available Vouchers List */}
                    {activeVouchers.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-2">Available Vouchers:</p>
                        <div className="flex flex-col gap-2">
                          {activeVouchers.map(v => {
                            const isLocked = v.targetTier && v.targetTier !== 'ALL' && (!user || user.currentTier !== v.targetTier);
                            
                            return (
                              <div key={v.id} className={`flex justify-between items-center border border-dashed rounded p-2 ${isLocked ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-70' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'}`}>
                                <div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-bold text-xs uppercase tracking-wider text-aria-charcoal dark:text-white">[{v.code}]</span>
                                    {isLocked && <span className="text-[10px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-bold">🔒 VIP {v.targetTier}</span>}
                                    {!isLocked && v.targetTier !== 'ALL' && <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-1 py-0.5 rounded font-bold">VIP {v.targetTier}</span>}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">
                                    Diskon {v.type === 'PERCENTAGE' ? `${v.value}%` : `Rp ${Number(v.value).toLocaleString('id-ID')}`}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => isLocked ? alert(`Voucher eksklusif ini hanya untuk pelanggan VIP ${v.targetTier}`) : handleApplyVoucher(v.code)}
                                  className={`text-[10px] font-bold uppercase tracking-widest ${isLocked ? 'text-gray-400 cursor-not-allowed' : 'text-aria-maroon hover:underline'}`}
                                >
                                  {isLocked ? 'Terkunci' : 'Pakai'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Points Toggle */}
                {isAuthenticated && user?.rewardPoints > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xs font-semibold tracking-widest uppercase text-aria-maroon dark:text-yellow-400 flex items-center gap-2">
                          🌟 Aria Points
                        </h3>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">
                          Pakai {user.rewardPoints} Poin (-Rp {(user.rewardPoints * 1000).toLocaleString('id-ID')})
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer scale-90">
                        <input type="checkbox" className="sr-only peer" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-aria-maroon dark:peer-checked:bg-yellow-400"></div>
                      </label>
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold uppercase tracking-widest border-t border-gray-200 dark:border-gray-800 pt-4 mt-4 dark:text-white">
                  <span>Total</span>
                  <span>Rp {finalTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Payment */}
          {step === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-lg font-medium tracking-widest uppercase mb-8 pb-4 border-b border-gray-200 dark:border-gray-800 dark:text-white">Payment</h2>
                
                <div className="mb-8 border border-gray-200 dark:border-gray-800 p-6 dark:bg-black">
                  <h3 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-4">Shipping To</h3>
                  <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed uppercase tracking-wide">
                    {watch('firstName')} {watch('lastName')}<br/>
                    {watch('address')}<br/>
                    {watch('city')}, {watch('postalCode')}<br/>
                    {watch('country')}<br/>
                    {watch('phone')} | {watch('email')}
                  </p>
                  <button onClick={() => setStep(2)} className="mt-4 text-xs font-semibold tracking-widest uppercase text-aria-charcoal dark:text-white underline underline-offset-4">
                    Edit Details
                  </button>
                </div>


                <div className="mb-8 border border-aria-charcoal dark:border-white p-6 relative overflow-hidden dark:bg-black">
                  <div className="absolute top-0 right-0 bg-aria-charcoal dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest px-3 py-1">Selected</div>
                  <h3 className="text-sm font-semibold tracking-widest uppercase text-aria-charcoal dark:text-white mb-2">Bank Transfer</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-wider">
                    Make your payment directly into our bank account. Your order will not be shipped until the funds have cleared in our account.
                  </p>
                </div>

                {orderError && (
                  <div className="mb-6 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-center colorblind:border-aria-cb-error colorblind:border-2">
                    <p className="text-sm text-red-600 dark:text-red-400 colorblind:text-aria-cb-error">{orderError}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(2)} className="w-1/3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-4 text-sm font-medium tracking-widest uppercase hover:border-aria-charcoal dark:hover:border-white transition-colors">
                    Back
                  </button>
                  <button 
                    onClick={async () => {
                      setOrderError(null);
                      try {
                        setLoading(true);
                        const addressData = watch();
                        let response;
                        
                        const itemsPayload = cartItems.map((item) => ({
                          productId: item.originalId || item.id,
                          quantity: item.quantity,
                          size: item.size,
                          color: item.color
                        }));

                        if (checkoutType === 'guest') {
                          response = await api.post('/orders/guest', {
                            guestEmail: addressData.email,
                            firstName: addressData.firstName,
                            lastName: addressData.lastName,
                            address: addressData.address,
                            city: addressData.city,
                            postalCode: addressData.postalCode,
                            phone: addressData.phone,
                            items: itemsPayload,
                            paymentMethod: 'BANK_TRANSFER',
                            voucherCode: appliedVoucher?.code || null,
                          });
                        } else {
                          response = await api.post('/orders', {
                            deliveryAddress: {
                              fullName: `${addressData.firstName} ${addressData.lastName}`.trim(),
                              addressLine1: addressData.address,
                              city: addressData.city,
                              state: addressData.city,
                              postalCode: addressData.postalCode,
                              country: addressData.country,
                            },
                            items: itemsPayload,
                            paymentMethod: 'BANK_TRANSFER',
                            usePoints,
                            voucherCode: appliedVoucher?.code || null,
                          });
                        }

                        setLoading(false);
                        const orderData = response.data?.data;
                        if (orderData) {
                          clearCart();
                          if (orderData.snapToken && window.snap) {
                            window.snap.pay(orderData.snapToken, {
                              onSuccess: function(result) {
                                setCreatedOrderId(orderData.orderId || orderData.id);
                                setOrderSuccess(true);
                                setStep(4);
                              },
                              onPending: function(result) {
                                setCreatedOrderId(orderData.orderId || orderData.id);
                                setOrderSuccess(true);
                                setStep(4);
                              },
                              onError: function(result) {
                                setOrderError('Payment failed!');
                              },
                              onClose: function() {
                                setCreatedOrderId(orderData.orderId || orderData.id);
                                setOrderSuccess(true);
                                setStep(4);
                              }
                            });
                          } else if (orderData.paymentUrl) {
                            window.location.href = orderData.paymentUrl;
                          } else {
                            const id = orderData.orderId || orderData.id;
                            if (id) {
                              setCreatedOrderId(id);
                              setOrderSuccess(true);
                              setStep(4);
                            }
                          }
                        }
                      } catch (e) {
                        setLoading(false);
                        setOrderError(e?.response?.data?.message || 'Failed to process order.');
                      }
                    }}
                    className="w-2/3 bg-aria-charcoal dark:bg-white text-white dark:text-black py-4 text-sm font-medium tracking-widest uppercase hover:bg-aria-maroon transition-colors"
                  >
                    Place Order
                  </button>
                </div>
              </div>

              {/* Cart Summary sidebar */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-6 self-start border border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-medium tracking-widest uppercase mb-4 pb-4 border-b border-gray-200 dark:border-gray-800 dark:text-white">Order Summary</h3>
                <div className="space-y-4 mb-4">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 truncate mr-4 uppercase tracking-wider text-xs">
                        {item.quantity}x {item.productName} 
                        {item.size && ` - ${item.size}`}
                      </span>
                      <span className="font-medium text-aria-charcoal dark:text-white">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-base font-semibold uppercase tracking-widest border-t border-gray-200 dark:border-gray-800 pt-4 dark:text-white">
                  <span>Subtotal</span>
                  <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
                </div>
                {tierDiscountAmount > 0 && (
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 pt-2">
                    <span>{profile?.currentTier} TIER DISCOUNT ({tierDiscountPercentage}%)</span>
                    <span>- Rp {tierDiscountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {appliedVoucher && (
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 pt-2">
                    <span className="flex items-center gap-2">
                      VOUCHER: {appliedVoucher.code}
                      <button onClick={handleRemoveVoucher} className="text-gray-400 hover:text-red-500 text-[10px] underline">Remove</button>
                    </span>
                    <span>- Rp {voucherDiscountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {usePoints && (
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-aria-maroon dark:text-yellow-400 pt-2">
                    <span>Aria Points</span>
                    <span>- Rp {pointsDeducted.toLocaleString('id-ID')}</span>
                  </div>
                )}
                
                {/* Voucher Input */}
                {!appliedVoucher && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Voucher Code" 
                        value={voucherInput}
                        onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                        className="flex-1 border border-gray-300 dark:border-gray-700 p-2 text-sm bg-transparent dark:text-white uppercase focus:outline-none focus:border-aria-charcoal dark:focus:border-white"
                      />
                      <button 
                        type="button"
                        onClick={handleApplyVoucher}
                        disabled={voucherLoading || !voucherInput.trim()}
                        className="bg-aria-charcoal text-white dark:bg-white dark:text-black px-4 py-2 text-xs font-semibold tracking-widest uppercase disabled:opacity-50"
                      >
                        {voucherLoading ? 'Wait' : 'Apply'}
                      </button>
                    </div>
                    {voucherError && <p className="text-red-500 text-xs mt-2 font-medium">{voucherError}</p>}
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold uppercase tracking-widest border-t border-gray-200 dark:border-gray-800 pt-4 mt-4 dark:text-white">
                  <span>Total</span>
                  <span>Rp {finalTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && orderSuccess && (
            <div className="max-w-2xl mx-auto mt-8 border border-gray-200 dark:border-gray-800 p-12 text-center dark:bg-black">
              <div className="w-16 h-16 bg-aria-charcoal dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h2 className="text-2xl font-display font-medium uppercase tracking-widest text-aria-charcoal dark:text-white mb-4">{t.confirmed}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t.orderId} <strong className="text-aria-charcoal dark:text-white">{createdOrderId}</strong></p>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-10 leading-relaxed max-w-md mx-auto">
                {t.desc}
              </p>
              <button
                onClick={() => navigate(`/order-tracking/${createdOrderId}`)}
                className="bg-aria-charcoal dark:bg-white text-white dark:text-black px-8 py-4 text-sm font-medium tracking-[0.15em] uppercase hover:bg-aria-maroon transition-colors"
              >
                {t.btn}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import useUIStore from '../store/uiStore';
import api from '../services/api';

const addressSchema = z.object({
  firstName: z.string().min(2, 'Nama depan minimal 2 karakter'),
  lastName: z.string().min(2, 'Nama belakang minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit'),
  address: z.string().min(5, 'Alamat minimal 5 karakter'),
  city: z.string().min(2, 'Kota minimal 2 karakter'),
  postalCode: z.string().min(4, 'Kode pos minimal 4 digit'),
  country: z.string().default('INDONESIA'),
});

export default function Checkout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const cartItems = useCartStore((s) => s.items);
  const setLoading = useUIStore((s) => s.setLoading);
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Choose, 2: Address, 3: Review, 4: Payment
  const [checkoutType, setCheckoutType] = useState(null); // 'guest' atau 'account'
  const [orderError, setOrderError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      country: 'INDONESIA',
      email: user?.email || '',
      firstName: user?.fullName?.split(' ')[0] || '',
      lastName: user?.fullName?.split(' ').slice(1).join(' ') || '',
    },
  });

  useEffect(() => {
    if (!cartItems.length && step > 1) {
      navigate('/');
    }
  }, []);

  if (!cartItems.length && step === 1) {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-6 bg-yellow-50 rounded border border-yellow-200">
        <h2 className="text-lg font-semibold text-yellow-800">Keranjang Kosong</h2>
        <p className="text-sm text-yellow-600 mt-2">Tambahkan produk ke keranjang terlebih dahulu</p>
        <button onClick={() => navigate('/')} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
          Kembali ke Produk
        </button>
      </div>
    );
  }

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Step 1: Choose authentication method
  if (step === 1) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-semibold mb-6">Pilih Cara Checkout</h1>
        
        {isAuthenticated ? (
          <>
            <button
              onClick={() => {
                setCheckoutType('account');
                setStep(2);
              }}
              className="w-full mb-4 bg-blue-600 text-white py-3 rounded font-medium"
            >
              Checkout dengan Akun {user?.fullName}
            </button>
            <button
              onClick={() => {
                setCheckoutType('guest');
                setStep(2);
              }}
              className="w-full bg-gray-300 text-gray-700 py-3 rounded font-medium"
            >
              Checkout sebagai Tamu
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate('/login')}
              className="w-full mb-4 bg-blue-600 text-white py-3 rounded font-medium"
            >
              Masuk untuk Checkout
            </button>
            <div className="my-4 text-center text-sm text-gray-500">atau</div>
            <button
              onClick={() => {
                setCheckoutType('guest');
                setStep(2);
              }}
              className="w-full bg-green-600 text-white py-3 rounded font-medium"
            >
              Checkout sebagai Tamu
            </button>
          </>
        )}
      </div>
    );
  }

  // Step 2: Address Form
  if (step === 2) {
    const onAddressSubmit = (data) => {
      setStep(3);
    };

    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-semibold mb-2">Alamat Pengiriman</h1>
        <p className="text-sm text-gray-600 mb-4">Langkah 1 dari 3</p>

        <form onSubmit={handleSubmit(onAddressSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Nama Depan</label>
              <input
                type="text"
                {...register('firstName')}
                className="mt-1 block w-full border rounded px-3 py-2"
                placeholder="Nama depan"
              />
              {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Nama Belakang</label>
              <input
                type="text"
                {...register('lastName')}
                className="mt-1 block w-full border rounded px-3 py-2"
                placeholder="Nama belakang"
              />
              {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              {...register('email')}
              className="mt-1 block w-full border rounded px-3 py-2"
              placeholder="email@contoh.com"
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Nomor Telepon</label>
            <input
              type="tel"
              {...register('phone')}
              className="mt-1 block w-full border rounded px-3 py-2"
              placeholder="08123456789"
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Alamat</label>
            <input
              type="text"
              {...register('address')}
              className="mt-1 block w-full border rounded px-3 py-2"
              placeholder="Jln. Contoh No. 123"
            />
            {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Kota</label>
              <input
                type="text"
                {...register('city')}
                className="mt-1 block w-full border rounded px-3 py-2"
                placeholder="Kota"
              />
              {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Kode Pos</label>
              <input
                type="text"
                {...register('postalCode')}
                className="mt-1 block w-full border rounded px-3 py-2"
                placeholder="12210"
              />
              {errors.postalCode && <p className="text-xs text-red-500">{errors.postalCode.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Negara</label>
              <select
                {...register('country')}
                className="mt-1 block w-full border rounded px-3 py-2 bg-white"
              >
                <option value="INDONESIA">Indonesia</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded font-medium"
            >
              Kembali
            </button>
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-medium">
              Lanjut
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Step 3: Review
  if (step === 3) {
    const addressData = watch();
    const onReviewSubmit = async () => {
      setOrderError(null);
      try {
        setLoading(true);
        const payload = {
          [checkoutType === 'guest' ? 'guestEmail' : 'userId']: checkoutType === 'guest' ? addressData.email : user?.id,
          firstName: addressData.firstName,
          lastName: addressData.lastName,
          address: addressData.address,
          city: addressData.city,
          postalCode: addressData.postalCode,
          phone: addressData.phone,
          items: cartItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          paymentMethod: 'PENDING',
        };

        let response;
        if (checkoutType === 'guest') {
          response = await api.post('/orders/guest', payload);
        } else {
          response = await api.post('/orders', payload);
        }

        setLoading(false);
        if (response.data?.orderId) {
          setCreatedOrderId(response.data.orderId);
          setOrderSuccess(true);
          setStep(4);
        }
      } catch (e) {
        setLoading(false);
        setOrderError(e?.response?.data?.message || 'Gagal membuat pesanan');
      }
    };

    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-semibold mb-2">Ringkasan Pesanan</h1>
        <p className="text-sm text-gray-600 mb-6">Langkah 2 dari 3</p>

        <div className="mb-6 bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-3">Alamat Pengiriman</h3>
          <p className="text-sm">
            {addressData.firstName} {addressData.lastName}<br/>
            {addressData.address}<br/>
            {addressData.city}, {addressData.postalCode}<br/>
            {addressData.phone} | {addressData.email}
          </p>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-3">Produk</h3>
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between py-2 border-b text-sm">
              <span>{item.name} x {item.quantity}</span>
              <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
            </div>
          ))}
        </div>

        <div className="mb-6 bg-blue-50 p-4 rounded border-l-4 border-blue-500">
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {orderError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">{orderError}</p>}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded font-medium"
          >
            Kembali
          </button>
          <button
            onClick={onReviewSubmit}
            className="flex-1 bg-green-600 text-white py-2 rounded font-medium"
          >
            Proses Pembayaran
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Success
  if (step === 4 && orderSuccess) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 bg-green-50 rounded border border-green-200">
        <h2 className="text-lg font-semibold text-green-700">Pesanan Berhasil Dibuat!</h2>
        <p className="text-sm text-green-600 mt-2">ID Pesanan: {createdOrderId}</p>
        <p className="text-sm text-green-600 mt-1">Silahkan lanjut ke pembayaran</p>
        <button
          onClick={() => navigate(`/order-tracking/${createdOrderId}`)}
          className="w-full mt-4 bg-green-600 text-white py-2 rounded font-medium"
        >
          Lacak Pesanan
        </button>
      </div>
    );
  }

  return null;
}

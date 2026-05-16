'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CheckoutPage() {
  const [isGuest, setIsGuest] = useState(true);
  const [formData, setFormData] = useState({
    country: 'INDONESIA',
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    province: 'EAST JAVA',
    postalCode: '',
    phone: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          isGuest,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Checkout failed');
        return;
      }

      // Redirect to payment
      window.location.href = `/payment/${data.orderId}`;
    } catch (err) {
      alert('Connection error. Please try again.');
    }
  };

  return (
    <div className='min-h-screen bg-white py-12 px-4'>
      <div className='max-w-2xl mx-auto'>
        <h1 className='text-3xl font-black tracking-tighter mb-8'>CHECKOUT</h1>

        <form onSubmit={handleCheckout} className='space-y-8'>
          {/* DELIVERY SECTION */}
          <div className='border-t pt-8'>
            <h2 className='text-lg font-bold uppercase mb-6 tracking-tighter'>Delivery</h2>

            {/* Country */}
            <div className='mb-6'>
              <label className='block text-xs font-semibold text-gray-600 mb-2 tracking-wide'>
                COUNTRY/REGION
              </label>
              <select
                name='country'
                value={formData.country}
                onChange={handleChange}
                className='w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black'
              >
                <option value='INDONESIA'>INDONESIA</option>
                <option value='SINGAPORE'>SINGAPORE</option>
                <option value='MALAYSIA'>MALAYSIA</option>
              </select>
            </div>

            {/* First & Last Name */}
            <div className='grid grid-cols-2 gap-4 mb-6'>
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-2 tracking-wide'>
                  FIRST NAME
                </label>
                <input
                  type='text'
                  name='firstName'
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder='First name'
                  required
                  className='w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black'
                />
              </div>
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-2 tracking-wide'>
                  LAST NAME
                </label>
                <input
                  type='text'
                  name='lastName'
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder='Last name'
                  required
                  className='w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black'
                />
              </div>
            </div>

            {/* Address */}
            <div className='mb-6'>
              <label className='block text-xs font-semibold text-gray-600 mb-2 tracking-wide'>
                ADDRESS
              </label>
              <input
                type='text'
                name='address'
                value={formData.address}
                onChange={handleChange}
                placeholder='Street address'
                required
                className='w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black'
              />
            </div>

            {/* Apartment/Suite */}
            <div className='mb-6'>
              <label className='block text-xs font-semibold text-gray-600 mb-2 tracking-wide'>
                APARTMENT, SUITE, ETC. (OPTIONAL)
              </label>
              <input
                type='text'
                name='apartment'
                value={formData.apartment}
                onChange={handleChange}
                placeholder='Apartment, suite, etc.'
                className='w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black'
              />
            </div>

            {/* City */}
            <div className='mb-6'>
              <label className='block text-xs font-semibold text-gray-600 mb-2 tracking-wide'>
                CITY
              </label>
              <input
                type='text'
                name='city'
                value={formData.city}
                onChange={handleChange}
                placeholder='City'
                required
                className='w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black'
              />
            </div>

            {/* Province & Postal Code */}
            <div className='grid grid-cols-2 gap-4 mb-6'>
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-2 tracking-wide'>
                  PROVINCE
                </label>
                <select
                  name='province'
                  value={formData.province}
                  onChange={handleChange}
                  className='w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black'
                >
                  <option value='EAST JAVA'>EAST JAVA</option>
                  <option value='WEST JAVA'>WEST JAVA</option>
                  <option value='CENTRAL JAVA'>CENTRAL JAVA</option>
                </select>
              </div>
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-2 tracking-wide'>
                  POSTAL CODE
                </label>
                <input
                  type='text'
                  name='postalCode'
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder='Postal code'
                  required
                  className='w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black'
                />
              </div>
            </div>

            {/* Phone */}
            <div className='mb-6'>
              <label className='block text-xs font-semibold text-gray-600 mb-2 tracking-wide'>
                PHONE
              </label>
              <input
                type='tel'
                name='phone'
                value={formData.phone}
                onChange={handleChange}
                placeholder='Phone number'
                required
                className='w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black'
              />
            </div>
          </div>

          {/* ORDER SUMMARY */}
          <div className='border-t pt-8'>
            <h2 className='text-lg font-bold uppercase mb-6 tracking-tighter'>Order Summary</h2>
            <div className='space-y-3 mb-6'>
              <div className='flex justify-between'>
                <span>Subtotal</span>
                <span>Rp 199.000</span>
              </div>
              <div className='flex justify-between'>
                <span>Shipping</span>
                <span>Rp 50.000</span>
              </div>
              <div className='border-t pt-3 flex justify-between font-bold'>
                <span>Total</span>
                <span>Rp 249.000</span>
              </div>
            </div>
          </div>

          {/* CHECKOUT BUTTON */}
          <button
            type='submit'
            className='w-full bg-black text-white py-4 font-bold uppercase tracking-wide hover:bg-gray-900 transition-colors'
          >
            Continue to Payment
          </button>

          <p className='text-center text-sm text-gray-600'>
            <Link href='/' className='text-black font-semibold hover:underline'>
              ← Continue Shopping
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

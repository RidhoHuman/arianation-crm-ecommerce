'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Registration failed');
        return;
      }

      // Redirect to login
      window.location.href = '/login?registered=true';
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-white py-12 px-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-black tracking-tighter mb-2'>CREATE ACCOUNT</h1>
          <p className='text-gray-600'>Join Arianation community</p>
        </div>

        <form onSubmit={handleRegister} className='space-y-4'>
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
              {error}
            </div>
          )}

          <div>
            <label className='block text-xs font-semibold text-gray-700 mb-2 tracking-wide'>
              FULL NAME
            </label>
            <input
              type='text'
              name='name'
              value={formData.name}
              onChange={handleChange}
              placeholder='John Doe'
              required
              className='w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black transition-colors'
              disabled={loading}
            />
          </div>

          <div>
            <label className='block text-xs font-semibold text-gray-700 mb-2 tracking-wide'>
              EMAIL
            </label>
            <input
              type='email'
              name='email'
              value={formData.email}
              onChange={handleChange}
              placeholder='your@email.com'
              required
              className='w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black transition-colors'
              disabled={loading}
            />
          </div>

          <div>
            <label className='block text-xs font-semibold text-gray-700 mb-2 tracking-wide'>
              PASSWORD
            </label>
            <input
              type='password'
              name='password'
              value={formData.password}
              onChange={handleChange}
              placeholder='Min 8 characters'
              required
              className='w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black transition-colors'
              disabled={loading}
            />
          </div>

          <div>
            <label className='block text-xs font-semibold text-gray-700 mb-2 tracking-wide'>
              CONFIRM PASSWORD
            </label>
            <input
              type='password'
              name='confirmPassword'
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder='Confirm password'
              required
              className='w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black transition-colors'
              disabled={loading}
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-black text-white py-3 font-semibold uppercase tracking-wide hover:bg-gray-900 transition-colors disabled:opacity-50'
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className='mt-6 text-center text-sm text-gray-600'>
          Already have an account?{' '}
          <Link href='/login' className='text-black font-semibold hover:underline'>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

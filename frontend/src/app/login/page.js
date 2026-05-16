'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed');
        return;
      }

      // Save token to localStorage for API calls
      localStorage.setItem('accessToken', data.data.token);

      // Redirect based on role
      if (data.data.user.role === 'OWNER' || data.data.user.role === 'ADMIN') {
        window.location.href = '/admin';
      } else if (data.data.user.role === 'DESIGN_STAFF') {
        window.location.href = '/staff/dashboard';
      } else {
        window.location.href = '/dashboard';
      }
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
          <h1 className='text-3xl font-black tracking-tighter mb-2'>LOGIN</h1>
          <p className='text-gray-600'>Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className='space-y-4'>
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
              {error}
            </div>
          )}

          <div>
            <label className='block text-xs font-semibold text-gray-700 mb-2 tracking-wide'>
              EMAIL
            </label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Enter password'
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className='mt-6 space-y-3'>
          <p className='text-center text-sm text-gray-600'>
            Don't have an account?{' '}
            <Link href='/register' className='text-black font-semibold hover:underline'>
              Create one
            </Link>
          </p>
          <p className='text-center text-sm text-gray-600'>
            <Link href='/checkout?guest=true' className='text-black font-semibold hover:underline'>
              Continue as Guest
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

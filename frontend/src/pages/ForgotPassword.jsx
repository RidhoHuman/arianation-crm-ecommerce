import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, { email });
      setStatus('success');
      setMessage(response.data?.message || 'Tautan reset password telah dikirim ke email Anda.');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Gagal mengirim email reset password.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-black px-4 py-12">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-xl w-full max-w-md shadow-sm text-center">
        <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-aria-charcoal dark:text-white mb-2">Lupa Password?</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
          Masukkan alamat email yang terdaftar pada akun Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
        </p>

        {status === 'success' ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 text-sm border border-green-200">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            {status === 'error' && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs border border-red-200">
                {message}
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded px-4 py-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-aria-charcoal dark:bg-white text-white dark:text-aria-charcoal font-bold uppercase tracking-widest text-xs py-4 rounded hover:bg-black transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? 'Mengirim...' : 'Kirim Tautan Reset'}
            </button>
          </form>
        )}

        <div className="mt-8 text-xs text-gray-500">
          Ingat password Anda?{' '}
          <Link to="/" className="text-black dark:text-white font-bold underline">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

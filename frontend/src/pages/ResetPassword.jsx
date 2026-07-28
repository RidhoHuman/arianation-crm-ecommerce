import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Tautan reset password tidak valid atau tidak ditemukan.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Konfirmasi password tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setStatus('error');
      setMessage('Password minimal 6 karakter.');
      return;
    }

    setStatus('loading');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset-password`, { 
        token, 
        newPassword: password 
      });
      setStatus('success');
      setMessage(response.data?.message || 'Password berhasil diubah.');
      
      // Auto redirect to home/login after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Gagal mengatur ulang password.');
    }
  };

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-black px-4 py-12">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-xl w-full max-w-md shadow-sm text-center">
          <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-red-600 mb-2">Error</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-black px-4 py-12">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-xl w-full max-w-md shadow-sm text-center">
        <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-aria-charcoal dark:text-white mb-2">Password Baru</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
          Silakan buat kata sandi baru untuk akun Anda.
        </p>

        {status === 'success' ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 text-sm border border-green-200">
            {message}
            <p className="mt-2 font-bold text-xs">Mengarahkan ke Beranda...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {status === 'error' && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs border border-red-200">
                {message}
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                Password Baru
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded px-4 py-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded px-4 py-3 text-sm focus:outline-none focus:border-aria-charcoal dark:focus:border-white transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-aria-charcoal dark:bg-white text-white dark:text-aria-charcoal font-bold uppercase tracking-widest text-xs py-4 rounded hover:bg-black transition-colors disabled:opacity-50 mt-4"
            >
              {status === 'loading' ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

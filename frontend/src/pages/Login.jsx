import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useUIStore from '../store/uiStore';
import useAuthStore from '../store/authStore';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';

export default function LoginPage() {
  const { login } = useAuth();
  const setLoading = useUIStore((s) => s.setLoading);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      const user = useAuthStore.getState().user;
      if (user && (user.role === 'ADMIN' || user.role === 'OWNER')) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/account', { replace: true });
      }
    }
  }, [isAuthenticated, navigate]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setError(null);
    try {
      setLoading(true);
      const res = await login({ email: data.email, password: data.password });
      setLoading(false);
      if (res?.user && res?.token) {
        if (res.user.role === 'ADMIN' || res.user.role === 'OWNER') {
          navigate('/admin');
        } else {
          navigate('/account');
        }
      } else {
        setError('Login gagal. Periksa kredensial Anda.');
      }
    } catch (e) {
      setLoading(false);
      setError(e?.response?.data?.message || 'Terjadi kesalahan saat login');
    }
  };

  const apiBase = import.meta.env.VITE_API_URL || '/api';

  function redirectOAuth(provider) {
    // Backend should provide OAuth endpoints: /auth/oauth/:provider
    window.location.href = `${apiBase}/auth/oauth/${provider}`;
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Masuk ke akun Anda</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            {...register('email', { required: 'Email wajib diisi' })}
            className="mt-1 block w-full border rounded px-3 py-2"
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            {...register('password', { required: 'Password wajib diisi' })}
            className="mt-1 block w-full border rounded px-3 py-2"
          />
          <div className="flex justify-between items-center mt-1">
            {errors.password ? (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            ) : (
              <div /> // placeholder to keep flex space-between
            )}
            <a href="/forgot-password" className="text-xs text-blue-600 hover:underline">Lupa Password?</a>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 transition-colors">
          Masuk
        </button>
      </form>

      <div className="my-6 flex items-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink-0 mx-4 text-sm text-gray-500">atau masuk dengan</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <button
          type="button"
          onClick={() => redirectOAuth('google')}
          className="py-2.5 px-3 border border-gray-300 rounded flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <FcGoogle className="text-xl" />
          <span className="text-sm font-medium">Google</span>
        </button>
        <button
          type="button"
          onClick={() => redirectOAuth('facebook')}
          className="py-2.5 px-3 border border-gray-300 rounded flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <FaFacebook className="text-xl text-[#1877F2]" />
          <span className="text-sm font-medium">Facebook</span>
        </button>
      </div>

      <div className="mt-6 border-t pt-6 text-center">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Belum punya akun?</p>
        <p className="text-xs text-gray-500 mb-4">
          Buat akun sekarang dan dapatkan bonus <strong>10 Aria Points</strong> (setara Rp 10.000) untuk transaksi pertamamu!
        </p>
        <a href="/register" className="inline-block w-full bg-aria-charcoal text-white py-3 rounded-sm text-sm uppercase tracking-widest font-medium hover:bg-aria-maroon transition-colors">
          Daftar Sekarang
        </a>
      </div>
    </div>
  );
}

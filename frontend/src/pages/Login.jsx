import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useUIStore from '../store/uiStore';

export default function LoginPage() {
  const { login } = useAuth();
  const setLoading = useUIStore((s) => s.setLoading);
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setError(null);
    try {
      setLoading(true);
      const res = await login({ email: data.email, password: data.password });
      setLoading(false);
      if (res?.user && res?.token) {
        navigate('/');
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
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
          Masuk
        </button>
      </form>

      <div className="my-4 text-center text-sm text-gray-500">atau masuk dengan</div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => redirectOAuth('google')}
          className="py-2 px-3 border rounded flex items-center justify-center"
        >
          Google
        </button>
        <button
          onClick={() => redirectOAuth('apple')}
          className="py-2 px-3 border rounded flex items-center justify-center"
        >
          Apple
        </button>
        <button
          onClick={() => redirectOAuth('instagram')}
          className="py-2 px-3 border rounded flex items-center justify-center"
        >
          Instagram
        </button>
      </div>

      <p className="mt-4 text-sm text-center">
        Belum punya akun? <a href="/register" className="text-blue-600">Daftar</a>
      </p>
    </div>
  );
}

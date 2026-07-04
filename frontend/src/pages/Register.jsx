import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useUIStore from '../store/uiStore';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';

const registerSchema = z.object({
  fullName: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

export default function Register() {
  const { register: authRegister } = useAuth();
  const setLoading = useUIStore((s) => s.setLoading);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setError(null);
    try {
      setLoading(true);
      const res = await authRegister({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone || null,
      });
      setLoading(false);
      if (res && res.token) {
        setSuccess(true);
        setTimeout(() => navigate('/'), 2000);
      } else {
        setError('Registrasi gagal');
      }
    } catch (e) {
      setLoading(false);
      setError(e?.response?.data?.message || 'Terjadi kesalahan saat registrasi');
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 bg-green-50 rounded border border-green-200">
        <h2 className="text-lg font-semibold text-green-700">Registrasi Berhasil!</h2>
        <p className="text-sm text-green-600 mt-2">Redirecting ke home...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Buat Akun Baru</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Nama Lengkap</label>
          <input
            type="text"
            {...register('fullName')}
            className="mt-1 block w-full border rounded px-3 py-2"
            placeholder="Nama lengkap Anda"
          />
          {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            {...register('email')}
            className="mt-1 block w-full border rounded px-3 py-2"
            placeholder="email@contoh.com"
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Nomor Telepon</label>
          <input
            type="tel"
            {...register('phone')}
            className="mt-1 block w-full border rounded px-3 py-2"
            placeholder="08123456789"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            {...register('password')}
            className="mt-1 block w-full border rounded px-3 py-2"
            placeholder="Minimal 8 karakter"
          />
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Konfirmasi Password</label>
          <input
            type="password"
            {...register('confirmPassword')}
            className="mt-1 block w-full border rounded px-3 py-2"
            placeholder="Masukkan ulang password"
          />
          {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-medium">
          Daftar
        </button>
      </form>

      <div className="my-6 flex items-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink-0 mx-4 text-sm text-gray-500">atau daftar dengan</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/auth/oauth/google` }}
          className="py-2.5 px-3 border border-gray-300 rounded flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <FcGoogle className="text-xl" />
          <span className="text-sm font-medium">Google</span>
        </button>
        <button
          type="button"
          onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/auth/oauth/facebook` }}
          className="py-2.5 px-3 border border-gray-300 rounded flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <FaFacebook className="text-xl text-[#1877F2]" />
          <span className="text-sm font-medium">Facebook</span>
        </button>
      </div>

      <p className="mt-8 text-sm text-center">
        Sudah punya akun? <a href="/login" className="text-blue-600 font-medium">Masuk</a>
      </p>
    </div>
  );
}

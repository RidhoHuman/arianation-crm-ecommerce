import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import useUIStore from '../store/uiStore';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const getRegisterSchema = (t) => z.object({
  fullName: z.string().min(3, t('nameMin3')),
  email: z.string().email(t('emailInvalid')),
  password: z.string().min(8, t('passMin8')),
  confirmPassword: z.string(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('passMismatch'),
  path: ['confirmPassword'],
});

export default function Register() {
  const { t } = useTranslation('translation', { keyPrefix: 'auth' });
  const { register: authRegister } = useAuth();
  const setLoading = useUIStore((s) => s.setLoading);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(getRegisterSchema(t)),
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
        setError(t('registerFailed'));
      }
    } catch (e) {
      setLoading(false);
      setError(e?.response?.data?.message || t('registerError'));
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 bg-green-50 rounded border border-green-200">
        <h2 className="text-lg font-semibold text-green-700">{t('registerSuccess')}</h2>
        <p className="text-sm text-green-600 mt-2">{t('redirecting')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">{t('registerTitle')}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">{t('fullName')}</label>
          <input
            type="text"
            {...register('fullName')}
            className="mt-1 block w-full border rounded px-3 py-2"
            placeholder={t('fullNamePlaceholder')}
          />
          {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">{t('email')}</label>
          <input
            type="email"
            {...register('email')}
            className="mt-1 block w-full border rounded px-3 py-2"
            placeholder={t('emailPlaceholder')}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">{t('phone')}</label>
          <input
            type="tel"
            {...register('phone')}
            className="mt-1 block w-full border rounded px-3 py-2"
            placeholder={t('phonePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">{t('password')}</label>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              {...register('password')}
              className="block w-full border rounded px-3 py-2 pr-10"
              placeholder={t('passwordPlaceholder')}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">{t('confirmPassword')}</label>
          <div className="relative mt-1">
            <input
              type={showConfirmPassword ? "text" : "password"}
              {...register('confirmPassword')}
              className="block w-full border rounded px-3 py-2 pr-10"
              placeholder={t('confirmPasswordPlaceholder')}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-medium">
          {t('registerBtn')}
        </button>
      </form>

      <div className="my-6 flex items-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink-0 mx-4 text-sm text-gray-500">{t('orRegisterWith')}</span>
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
        {t('alreadyHaveAccount')} <a href="/login" className="text-blue-600 font-medium">{t('loginBtn')}</a>
      </p>
    </div>
  );
}

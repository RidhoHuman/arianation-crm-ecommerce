import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import useUIStore from '../store/uiStore';
import useAuthStore from '../store/authStore';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';

import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'auth' });
  const { login } = useAuth();
  const setLoading = useUIStore((s) => s.setLoading);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

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
        setError(t('loginFailed'));
      }
    } catch (e) {
      setLoading(false);
      setError(e?.response?.data?.message || t('loginError'));
    }
  };

  const apiBase = import.meta.env.VITE_API_URL || '/api';

  function redirectOAuth(provider) {
    // Backend should provide OAuth endpoints: /auth/oauth/:provider
    window.location.href = `${apiBase}/auth/oauth/${provider}`;
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">{t('loginTitle')}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">{t('email')}</label>
          <input
            type="email"
            {...register('email', { required: t('emailRequired') })}
            className="mt-1 block w-full border rounded px-3 py-2"
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">{t('password')}</label>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              {...register('password', { required: t('passwordRequired') })}
              className="block w-full border rounded px-3 py-2 pr-10"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          <div className="flex justify-between items-center mt-1">
            {errors.password ? (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            ) : (
              <div /> // placeholder to keep flex space-between
            )}
            <a href="/forgot-password" className="text-xs text-blue-600 hover:underline">{t('forgotPassword')}</a>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 transition-colors">
          {t('loginBtn')}
        </button>
      </form>

      <div className="my-6 flex items-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink-0 mx-4 text-sm text-gray-500">{t('orLoginWith')}</span>
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
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">{t('noAccount')}</p>
        <p className="text-xs text-gray-500 mb-4">
          {t('registerPromo')}
        </p>
        <a href="/register" className="inline-block w-full bg-aria-charcoal text-white py-3 rounded-sm text-sm uppercase tracking-widest font-medium hover:bg-aria-maroon transition-colors">
          {t('registerBtn')}
        </a>
      </div>
    </div>
  );
}

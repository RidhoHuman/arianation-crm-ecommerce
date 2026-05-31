import { useCallback } from 'react';
import useAuthStore from '../store/authStore';
import * as authService from '../services/authService';

export function useAuth() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const login = useCallback(async (credentials) => {
    try {
      console.log('🔐 useAuth.login() called');
      const response = await authService.login(credentials);
      console.log('📨 authService.login response:', response);
      
      if (response?.data?.token) {
        console.log('💾 Menyimpan auth ke store...');
        setAuth(response.data.user, response.data.token);
        console.log('✅ Auth tersimpan. User:', response.data.user?.email);
        return response.data;
      } else {
        console.log('⚠️ Response tidak punya data.token');
        return response;
      }
    } catch (error) {
      console.error('❌ useAuth.login error:', error);
      throw error;
    }
  }, [setAuth]);

  const register = useCallback(async (payload) => {
    const response = await authService.register(payload);
    if (response?.data?.token) {
      setAuth(response.data.user, response.data.token);
    }
    return response?.data;
  }, [setAuth]);

  const logout = useCallback(async () => {
    await authService.logout();
    clearAuth();
  }, [clearAuth]);

  return { login, register, logout };
}

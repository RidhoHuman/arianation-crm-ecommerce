import { useCallback } from 'react';
import useAuthStore from '../store/authStore';
import * as authService from '../services/authService';

export function useAuth() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const login = useCallback(async (credentials) => {
    const response = await authService.login(credentials);
    if (response?.data?.token) {
      setAuth(response.data.user, response.data.token);
    }
    return response?.data;
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

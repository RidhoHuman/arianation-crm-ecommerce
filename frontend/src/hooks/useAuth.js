import { useCallback } from 'react';
import useAuthStore from '../store/authStore';
import * as authService from '../services/authService';

export function useAuth() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    if (data?.token) {
      setAuth(data.user, data.token);
    }
    return data;
  }, [setAuth]);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    if (data?.token) {
      setAuth(data.user, data.token);
    }
    return data;
  }, [setAuth]);

  const logout = useCallback(async () => {
    await authService.logout();
    clearAuth();
  }, [clearAuth]);

  return { login, register, logout };
}

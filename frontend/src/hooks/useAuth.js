import { useCallback } from 'react';
import useAuthStore from '../store/authStore';
import * as authService from '../services/authService';
import useCartStore from '../store/cartStore';

export function useAuth() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const login = useCallback(async (credentials) => {
    try {
      console.log('🔐 useAuth.login() called');
      const response = await authService.login(credentials);
      console.log('📨 authService.login response:', response);
      
      // response struktur: { success, message, data: { user, token } }
      // Jadi cek yang benar adalah response.data.token
      const userData = response?.data?.user;
      const token = response?.data?.token;
      
      if (userData && token) {
        console.log('💾 Menyimpan auth ke store...');
        setAuth(userData, token);
        console.log('✅ Auth tersimpan. User:', userData?.email);
        
        // Fetch cart to merge local and pull remote
        useCartStore.getState().fetchCart();
        
        // Return { user, token } untuk Login.jsx
        return { user: userData, token };
      } else {
        console.log('⚠️ Response tidak punya data lengkap. userData:', !!userData, 'token:', !!token);
        return null;
      }
    } catch (error) {
      console.error('❌ useAuth.login error:', error);
      throw error;
    }
  }, [setAuth]);

  const register = useCallback(async (payload) => {
    try {
      console.log('🔐 useAuth.register() called');
      const response = await authService.register(payload);
      console.log('📨 authService.register response:', response);
      
      const userData = response?.data?.user;
      const token = response?.data?.token;
      
      if (userData && token) {
        console.log('💾 Menyimpan auth ke store...');
        setAuth(userData, token);
        console.log('✅ Auth tersimpan. User:', userData?.email);
        return { user: userData, token };
      } else {
        console.log('⚠️ Response tidak punya data lengkap');
        return null;
      }
    } catch (error) {
      console.error('❌ useAuth.register error:', error);
      throw error;
    }
  }, [setAuth]);



  const logout = useCallback(async () => {
    console.log('🔓 useAuth.logout() called');
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Logout API call failed, but clearing auth anyway:', e);
    }
    useCartStore.getState().clearCart(false);
    clearAuth();
    console.log('✅ Auth cleared');
  }, [clearAuth]);

  return { login, register, logout };
}

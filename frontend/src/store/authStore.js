import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  
  setAuth(user, token) {
    console.log('🔐 authStore.setAuth() called');
    console.log('  User:', user?.email, 'Token ada:', !!token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    console.log('  ✓ localStorage updated');
    set({ user, token, isAuthenticated: true });
    console.log('  ✓ Zustand state updated via set()');
  },
  
  clearAuth() {
    console.log('🔓 authStore.clearAuth()');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  // Hydrate dari localStorage
  hydrate() {
    console.log('💧 authStore.hydrate() - read dari localStorage');
    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      const user = userStr ? JSON.parse(userStr) : null;
      
      console.log('  User:', user?.email, 'Token ada:', !!token);
      set({ user, token, isAuthenticated: !!token });
      console.log('  ✓ Hydrate complete');
      return { user, token, isAuthenticated: !!token };
    } catch (e) {
      console.error('  ❌ Hydrate error:', e);
      return { user: null, token: null, isAuthenticated: false };
    }
  },
}));

export default useAuthStore;

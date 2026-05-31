import { create } from 'zustand';

const useAuthStore = create((set, get) => {
  // Initial state dari localStorage
  const initFromStorage = () => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    return {
      user: userStr ? JSON.parse(userStr) : null,
      token: token || null,
      isAuthenticated: !!token,
    };
  };

  return {
    ...initFromStorage(),
    
    setAuth(user, token) {
      console.log('🔐 authStore.setAuth() - simpan ke localStorage');
      console.log('User:', user?.email, 'Token ada:', !!token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true });
      console.log('✅ authStore updated');
    },
    
    clearAuth() {
      console.log('🔓 authStore.clearAuth()');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    },
    
    // Helper to reload from localStorage (for app initialization)
    rehydrate() {
      console.log('Rehydrating authStore dari localStorage');
      const state = initFromStorage();
      set(state);
      return state;
    },
  };
});

export default useAuthStore;

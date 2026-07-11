import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n';

const useUIStore = create(
  persist(
    (set) => ({
      isLoading: false,
      language: 'ID', // default to Bahasa Indonesia
      theme: 'light', // 'light' | 'dark'
      isColorblindMode: false,
      notifications: [],
      
      setLoading(v) {
        set({ isLoading: v });
      },
      setLanguage(lang) {
        set({ language: lang });
        i18n.changeLanguage(lang);
      },
      setTheme(theme) {
        set({ theme });
      },
      toggleColorblindMode() {
        set((state) => ({ isColorblindMode: !state.isColorblindMode }));
      },
      addNotification(n) {
        set((s) => ({ notifications: [...s.notifications, n] }));
      },
      removeNotification(id) {
        set((s) => ({ notifications: s.notifications.filter((x) => x.id !== id) }));
      },
    }),
    {
      name: 'arianation-ui-storage',
      partialize: (state) => ({ 
        language: state.language, 
        theme: state.theme, 
        isColorblindMode: state.isColorblindMode 
      }),
    }
  )
);

export default useUIStore;

import create from 'zustand';

const useUIStore = create((set) => ({
  isLoading: false,
  notifications: [],
  setLoading(v) {
    set({ isLoading: v });
  },
  addNotification(n) {
    set((s) => ({ notifications: [...s.notifications, n] }));
  },
  removeNotification(id) {
    set((s) => ({ notifications: s.notifications.filter((x) => x.id !== id) }));
  },
}));

export default useUIStore;

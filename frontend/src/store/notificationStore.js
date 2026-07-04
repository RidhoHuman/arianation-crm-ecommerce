import { create } from 'zustand';
import api from '../services/api';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/notifications');
      set({ notifications: data.data || [], isLoading: false });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      set({ unreadCount: data.count || 0 });
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  },

  markAsRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      // Update local state
      const { notifications, unreadCount } = get();
      set({
        notifications: notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
        unreadCount: Math.max(0, unreadCount - 1)
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/mark-all-read');
      const { notifications } = get();
      set({
        notifications: notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  },

  deleteNotification: async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      const { notifications, unreadCount } = get();
      const notifToDelete = notifications.find(n => n.id === id);
      set({
        notifications: notifications.filter(n => n.id !== id),
        unreadCount: (notifToDelete && !notifToDelete.isRead) ? Math.max(0, unreadCount - 1) : unreadCount
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }
}));

export default useNotificationStore;

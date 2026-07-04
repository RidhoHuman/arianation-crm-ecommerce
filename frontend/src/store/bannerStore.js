import { create } from 'zustand';
import api from '../services/api';

const useBannerStore = create((set, get) => ({
  banners: [],
  isLoading: false,
  error: null,

  fetchBanners: async (location = '') => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/banners${location ? `?location=${location}` : ''}`);
      set({ banners: data.data || [], isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
    }
  },

  createBanner: async (bannerData) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/banners', bannerData);
      await get().fetchBanners(); // Refresh list
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
      throw err;
    }
  },

  updateBanner: async (id, bannerData) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/banners/${id}`, bannerData);
      await get().fetchBanners(); // Refresh list
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
      throw err;
    }
  },

  deleteBanner: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/banners/${id}`);
      await get().fetchBanners(); // Refresh list
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
      throw err;
    }
  }
}));

export default useBannerStore;

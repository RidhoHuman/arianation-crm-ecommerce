import { create } from 'zustand';
import api from '../services/api';

const useCollectionStore = create((set, get) => ({
  collections: [],
  isLoading: false,
  error: null,

  fetchCollections: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/collections');
      set({ collections: response.data.data, isLoading: false });
      return { success: true };
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Gagal mengambil data koleksi',
        isLoading: false,
      });
      return { success: false, message: error.response?.data?.message };
    }
  },

  createCollection: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // Auto generate slug if empty
      if (!data.slug) {
        data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      await api.post('/collections', data);
      await get().fetchCollections();
      return { success: true };
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Gagal membuat koleksi',
        isLoading: false,
      });
      return { success: false, message: error.response?.data?.message };
    }
  },

  updateCollection: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      if (data.name && !data.slug) {
        data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      await api.put(`/collections/${id}`, data);
      await get().fetchCollections();
      return { success: true };
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Gagal mengupdate koleksi',
        isLoading: false,
      });
      return { success: false, message: error.response?.data?.message };
    }
  },

  deleteCollection: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/collections/${id}`);
      await get().fetchCollections();
      return { success: true };
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Gagal menghapus koleksi',
        isLoading: false,
      });
      return { success: false, message: error.response?.data?.message };
    }
  },
}));

export default useCollectionStore;

// frontend/src/store/categoryStore.js
import { create } from 'zustand';
import api from '../services/api';

const useCategoryStore = create((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/categories', { params });
      set({ categories: response.data.data, isLoading: false });
      return { success: true };
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Gagal mengambil data kategori',
        isLoading: false,
      });
      return { success: false, message: error.response?.data?.message };
    }
  },

  createCategory: async (data, params = {}) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/categories', data);
      await get().fetchCategories(params);
      return { success: true };
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Gagal membuat kategori',
        isLoading: false,
      });
      return { success: false, message: error.response?.data?.message };
    }
  },

  updateCategory: async (id, data, params = {}) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/categories/${id}`, data);
      await get().fetchCategories(params);
      return { success: true };
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Gagal mengupdate kategori',
        isLoading: false,
      });
      return { success: false, message: error.response?.data?.message };
    }
  },

  deleteCategory: async (id, params = {}) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/categories/${id}`);
      await get().fetchCategories(params);
      return { success: true };
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Gagal menghapus kategori',
        isLoading: false,
      });
      return { success: false, message: error.response?.data?.message };
    }
  },
}));

export default useCategoryStore;

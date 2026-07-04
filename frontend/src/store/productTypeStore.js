import { create } from 'zustand';
import api from '../services/api';

const useProductTypeStore = create((set, get) => ({
  types: [],
  isLoading: false,
  error: null,

  fetchTypes: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/product-types', { params });
      set({ types: response.data.data || [], isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.error || 'Gagal memuat tipe produk', isLoading: false });
    }
  },

  createType: async (typeData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/product-types', typeData);
      set((state) => ({
        types: [...state.types, response.data.data],
        isLoading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.error || 'Gagal membuat tipe produk', isLoading: false });
      throw error;
    }
  },

  updateType: async (id, typeData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/product-types/${id}`, typeData);
      set((state) => ({
        types: state.types.map((type) => 
          type.id === id ? response.data.data : type
        ),
        isLoading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.error || 'Gagal mengubah tipe produk', isLoading: false });
      throw error;
    }
  },

  deleteType: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/product-types/${id}`);
      set((state) => ({
        types: state.types.filter((type) => type.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error.response?.data?.error || 'Gagal menghapus tipe produk', isLoading: false });
      throw error;
    }
  }
}));

export default useProductTypeStore;

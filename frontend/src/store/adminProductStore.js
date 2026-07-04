import { create } from 'zustand';
import api from '../services/api';

const useAdminProductStore = create((set, get) => ({
  products: [],
  pagination: null,
  isLoading: false,
  error: null,

  fetchProducts: async (params = { page: 1, limit: 10 }) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/admin/products', { params });
      set({ 
        products: res.data?.data || [],
        pagination: res.data?.meta || null,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch admin products:', error);
      set({ error: error.response?.data?.message || 'Gagal memuat daftar produk', isLoading: false });
    }
  },

  createProduct: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      // formData is a FormData object, not a plain object
      const res = await api.post('/admin/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Refresh list
      await get().fetchProducts();
      return { success: true, data: res.data?.data };
    } catch (error) {
      console.error('Failed to create product:', error);
      set({ error: error.response?.data?.message || 'Gagal membuat produk baru', isLoading: false });
      return { success: false, message: error.response?.data?.message || 'Gagal membuat produk' };
    }
  },

  updateProduct: async (id, formData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.put(`/admin/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Refresh list
      await get().fetchProducts();
      return { success: true, data: res.data?.data };
    } catch (error) {
      console.error('Failed to update product:', error);
      set({ error: error.response?.data?.message || 'Gagal mengupdate produk', isLoading: false });
      return { success: false, message: error.response?.data?.message || 'Gagal mengupdate produk' };
    }
  },

  deleteProduct: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/admin/products/${id}`);
      // Refresh list
      await get().fetchProducts();
      return { success: true };
    } catch (error) {
      console.error('Failed to delete product:', error);
      set({ error: error.response?.data?.message || 'Gagal menghapus produk', isLoading: false });
      return { success: false, message: error.response?.data?.message || 'Gagal menghapus produk' };
    }
  },
}));

export default useAdminProductStore;

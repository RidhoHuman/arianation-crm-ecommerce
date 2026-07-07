import { create } from 'zustand';
import api from '../services/api';

const usePrintTechniqueStore = create((set) => ({
  techniques: [],
  loading: false,
  error: null,

  fetchTechniquesAdmin: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/admin/techniques');
      set({ techniques: response.data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch techniques', loading: false });
    }
  },

  fetchTechniquesPublic: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/print-techniques');
      set({ techniques: response.data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch techniques', loading: false });
    }
  },

  createTechnique: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/admin/techniques', data);
      set((state) => ({ 
        techniques: [response.data.technique, ...state.techniques],
        loading: false 
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to create technique', loading: false });
      throw error;
    }
  },

  updateTechnique: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await api.put(`/admin/techniques/${id}`, data);
      set((state) => ({
        techniques: state.techniques.map((t) => (t.id === id ? { ...t, ...data } : t)),
        loading: false
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to update technique', loading: false });
      throw error;
    }
  },

  deleteTechnique: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/admin/techniques/${id}`);
      set((state) => ({
        techniques: state.techniques.filter((t) => t.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to delete technique', loading: false });
      throw error;
    }
  },
}));

export default usePrintTechniqueStore;

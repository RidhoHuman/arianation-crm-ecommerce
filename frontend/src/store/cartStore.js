import { create } from 'zustand';
import api from '../services/api';

const getLocalCart = () => JSON.parse(localStorage.getItem('cart') || '[]');
const setLocalCart = (items) => localStorage.setItem('cart', JSON.stringify(items));

const useCartStore = create((set, get) => ({
  items: getLocalCart(),
  loading: false,

  fetchCart: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ items: getLocalCart() });
      return;
    }

    set({ loading: true });
    try {
      // Merge local items to remote if any
      const localItems = getLocalCart();
      if (localItems.length > 0) {
        for (const item of localItems) {
          try {
            await api.post('/cart/items', {
              productId: item.originalId || item.id,
              variantId: item.variantId,
              quantity: item.quantity || 1
            });
          } catch(e) {
            console.warn('Failed to merge item', item.id);
          }
        }
        localStorage.removeItem('cart');
      }

      // Fetch from API
      const res = await api.get('/cart');
      const cartData = res.data?.data;
      
      if (cartData && cartData.items) {
        const mappedItems = cartData.items.map(item => ({
          cartItemId: item.id,
          id: item.productId + (item.variantId ? '-' + item.variantId : ''),
          originalId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          price: item.unitPrice || item.price,
          quantity: item.quantity,
          imageUrl: item.variantImage || item.imageUrl,
          size: item.size ? (item.size.includes('-') ? item.size.split('-')[1].trim() : item.size) : '',
          businessType: item.businessType || 'FASHION_RETAIL',
          color: item.color || (item.size && item.size.includes('-') ? item.size.split('-')[0].trim() : '')
        }));
        set({ items: mappedItems });
      } else {
        set({ items: [] });
      }
    } catch (error) {
      console.error('Fetch cart error', error);
      // Fallback
      set({ items: getLocalCart() });
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (item) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await api.post('/cart/items', {
          productId: item.originalId || item.id,
          variantId: item.variantId,
          quantity: item.quantity || 1
        });
        await get().fetchCart();
      } catch (err) {
        console.error('Failed to add item to remote cart', err);
      }
    } else {
      const items = [...get().items];
      const idx = items.findIndex((i) => i.id === item.id);
      if (idx > -1) {
        items[idx].quantity += item.quantity || 1;
      } else {
        items.push({ ...item, quantity: item.quantity || 1 });
      }
      setLocalCart(items);
      set({ items });
    }
  },

  removeItem: async (id) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const item = get().items.find(i => i.id === id);
        if (item && item.cartItemId) {
          await api.delete(`/cart/items/${item.cartItemId}`);
          await get().fetchCart();
        } else if (item && !item.cartItemId) {
          // If for some reason it's a local item stuck in remote state
          const newItems = get().items.filter(i => i.id !== id);
          set({ items: newItems });
        }
      } catch (err) {
        console.error('Failed to remove item from remote cart', err);
      }
    } else {
      const items = get().items.filter((i) => i.id !== id);
      setLocalCart(items);
      set({ items });
    }
  },

  updateQuantity: async (id, quantity) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const item = get().items.find(i => i.id === id);
        if (item && item.cartItemId) {
          await api.put(`/cart/items/${item.cartItemId}`, { quantity });
          await get().fetchCart();
        }
      } catch (err) {
        console.error('Failed to update remote cart quantity', err);
      }
    } else {
      const items = get().items.map((i) => (i.id === id ? { ...i, quantity } : i));
      setLocalCart(items);
      set({ items });
    }
  },

  clearCart: async (clearRemote = false) => {
    // Hapus dari local storage & state TERLEBIH DAHULU (Synchronous)
    // Ini mencegah race condition di mana halaman keburu unload (redirect)
    // sebelum baris kode ini tereksekusi, yang berakibat pada cart item "hidup lagi" 
    // karena difetch dari localStorage dan di-merge ke database saat halaman dimuat ulang.
    localStorage.removeItem('cart');
    set({ items: [] });

    if (clearRemote) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await api.delete('/cart');
        } catch(err) {
          console.error('Failed to clear remote cart', err);
        }
      }
    }
  },

  getTotal: () => {
    return get().items.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
  },
}));

export default useCartStore;

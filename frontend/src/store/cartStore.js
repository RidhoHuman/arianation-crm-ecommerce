import { create } from 'zustand';

const initial = JSON.parse(localStorage.getItem('cart') || '[]');

const useCartStore = create((set, get) => ({
  items: initial,
  addItem(item) {
    const items = [...get().items];
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx > -1) {
      items[idx].quantity += item.quantity || 1;
    } else {
      items.push({ ...item, quantity: item.quantity || 1 });
    }
    localStorage.setItem('cart', JSON.stringify(items));
    set({ items });
  },
  removeItem(id) {
    const items = get().items.filter((i) => i.id !== id);
    localStorage.setItem('cart', JSON.stringify(items));
    set({ items });
  },
  updateQuantity(id, quantity) {
    const items = get().items.map((i) => (i.id === id ? { ...i, quantity } : i));
    localStorage.setItem('cart', JSON.stringify(items));
    set({ items });
  },
  clearCart() {
    localStorage.removeItem('cart');
    set({ items: [] });
  },
  getTotal() {
    return get().items.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
  },
}));

export default useCartStore;

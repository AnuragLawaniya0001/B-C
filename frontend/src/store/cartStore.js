import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],

  /**
   * Add item to cart or increment quantity if exists
   * @param {{ productId: string, name: string, price: number, qty?: number, image?: string }} product
   */
  addItem: (product) => {
    const { items } = get();
    const existingIndex = items.findIndex((i) => i.productId === product.productId);

    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].qty += product.qty || 1;
      set({ items: updated });
    } else {
      set({
        items: [...items, { ...product, qty: product.qty || 1 }],
      });
    }
  },

  /**
   * Remove item from cart by productId
   * @param {string} productId
   */
  removeItem: (productId) => {
    set({
      items: get().items.filter((item) => item.productId !== productId),
    });
  },

  /**
   * Update quantity of item in cart
   * @param {string} productId
   * @param {number} qty
   */
  updateQty: (productId, qty) => {
    if (qty <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((item) =>
        item.productId === productId ? { ...item, qty } : item
      ),
    });
  },

  /**
   * Clear all items in cart
   */
  clearCart: () => {
    set({ items: [] });
  },

  /**
   * Calculate total price in paise
   * @returns {number}
   */
  getTotal: () => {
    return get().items.reduce((total, item) => total + (item.price || 0) * (item.qty || 1), 0);
  },

  /**
   * Calculate total count of items in cart
   * @returns {number}
   */
  getCount: () => {
    return get().items.reduce((count, item) => count + (item.qty || 1), 0);
  },
}));

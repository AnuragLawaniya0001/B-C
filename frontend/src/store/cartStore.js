import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      /**
       * Add item to cart or increment quantity if exists
       */
      addItem: (product) => {
        const { items } = get();
        const id = product.productId || product._id || product.slug;
        const price =
          product.price_paise !== undefined
            ? product.price_paise
            : product.price || 0;
        const qty = product.qty || product.quantity || 1;
        const image =
          product.image || (product.images && product.images[0]) || '';

        const normalizedProduct = {
          ...product,
          productId: id,
          _id: id,
          price,
          price_paise: price,
          qty,
          quantity: qty,
          image,
          images: product.images || (image ? [image] : []),
        };

        const existingIndex = items.findIndex(
          (i) => (i.productId || i._id) === id
        );

        if (existingIndex > -1) {
          const updated = [...items];
          const newQty = (updated[existingIndex].qty || 1) + qty;
          updated[existingIndex].qty = newQty;
          updated[existingIndex].quantity = newQty;
          set({ items: updated });
        } else {
          set({
            items: [...items, normalizedProduct],
          });
        }
      },

      /**
       * Remove item from cart by productId or _id
       */
      removeItem: (productId) => {
        set({
          items: get().items.filter(
            (item) => (item.productId || item._id) !== productId
          ),
        });
      },

      /**
       * Update quantity of item in cart
       */
      updateQty: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((item) =>
            (item.productId || item._id) === productId
              ? { ...item, qty, quantity: qty }
              : item
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
       */
      getTotal: () => {
        return get().items.reduce(
          (total, item) =>
            total +
            (item.price_paise !== undefined ? item.price_paise : item.price || 0) *
              (item.qty || item.quantity || 1),
          0
        );
      },

      /**
       * Calculate total count of items in cart
       */
      getCount: () => {
        return get().items.reduce(
          (count, item) => count + (item.qty || item.quantity || 1),
          0
        );
      },
    }),
    {
      name: 'bigchamp_cart',
    }
  )
);

export default useCartStore;

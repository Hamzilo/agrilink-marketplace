import { useCallback, useEffect, useMemo, useState } from "react";

export type CartItem = {
  productId: string;
  name: string;
  unitPrice: number; // display only; server recalculates from DB at checkout
  unit: string;
  quantity: number;
  maxQuantity: number; // stock snapshot at add time
  imageUrl: string | null;
  farmerName: string;
  location: string;
};

const STORAGE_KEY = "agrilink.cart.v1";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function persist(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("agrilink-cart-changed"));
  } catch {
    // Storage unavailable (private mode) — cart lives for the session only.
  }
}

/**
 * Buyer cart state, persisted to localStorage. Prices here are for display;
 * the server re-validates stock and recalculates totals from database values
 * when the order is actually placed.
 */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => loadCart());

  useEffect(() => {
    const sync = () => setItems(loadCart());
    window.addEventListener("agrilink-cart-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("agrilink-cart-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity: number }) => {
      const current = loadCart();
      const existing = current.find((i) => i.productId === item.productId);
      let next: CartItem[];
      if (existing) {
        next = current.map((i) =>
          i.productId === item.productId
            ? {
                ...i,
                quantity: Math.min(i.quantity + item.quantity, i.maxQuantity),
              }
            : i,
        );
      } else {
        next = [
          ...current,
          {
            ...item,
            quantity: Math.min(item.quantity, item.maxQuantity),
          },
        ];
      }
      persist(next);
    },
    [],
  );

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const current = loadCart();
    const next = current
      .map((i) =>
        i.productId === productId
          ? {
              ...i,
              quantity: Math.max(
                1,
                Math.min(Math.floor(quantity) || 1, i.maxQuantity),
              ),
            }
          : i,
      )
      .filter((i) => i.quantity > 0);
    persist(next);
  }, []);

  const removeItem = useCallback((productId: string) => {
    persist(loadCart().filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    persist([]);
  }, []);

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0,
    );
    return { count: items.length, subtotal };
  }, [items]);

  return { items, addItem, updateQuantity, removeItem, clearCart, totals };
}

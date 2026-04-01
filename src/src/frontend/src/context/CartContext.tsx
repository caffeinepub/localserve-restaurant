import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";
import type { CartItem } from "../types";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string, variant: string) => void;
  updateQty: (itemId: string, variant: string, delta: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.itemId === item.itemId && i.variant === item.variant,
      );
      if (existing) {
        return prev.map((i) =>
          i.itemId === item.itemId && i.variant === item.variant
            ? { ...i, qty: i.qty + item.qty }
            : i,
        );
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((itemId: string, variant: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.itemId === itemId && i.variant === variant)),
    );
  }, []);

  const updateQty = useCallback(
    (itemId: string, variant: string, delta: number) => {
      setItems((prev) =>
        prev
          .map((i) =>
            i.itemId === itemId && i.variant === variant
              ? { ...i, qty: i.qty + delta }
              : i,
          )
          .filter((i) => i.qty > 0),
      );
    },
    [],
  );

  const clearCart = useCallback(() => setItems([]), []);

  const totalCount = items.reduce((s, i) => s + i.qty, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        totalCount,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

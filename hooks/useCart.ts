// @/hooks/useCart.ts

"use client";
import { useMemo, useState } from "react";
import type { MenuRow } from "@/types/menu";
import type { CartItem } from "@/types/cart";

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const total = useMemo(
    () => cart.reduce((sum, it) => sum + it.price * it.quantity, 0),
    [cart]
  );

  function addToCart(item: MenuRow) {
    const price = Number(item.price);
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.menu_item_id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [...prev, { menu_item_id: item.id, name: item.name, price, quantity: 1, comment: "" }];
    });
  }

  function decQty(id: string) {
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.menu_item_id === id);
      if (idx < 0) return prev;
      const copy = [...prev];
      const nextQty = copy[idx].quantity - 1;
      if (nextQty <= 0) return copy.filter((x) => x.menu_item_id !== id);
      copy[idx] = { ...copy[idx], quantity: nextQty };
      return copy;
    });
  }

  function incQty(id: string) {
    setCart((prev) => prev.map((x) => (x.menu_item_id === id ? { ...x, quantity: x.quantity + 1 } : x)));
  }

  function updateComment(id: string, comment: string) {
    setCart((prev) => prev.map((x) => (x.menu_item_id === id ? { ...x, comment } : x)));
  }

  function clearCart() {
    setCart([]);
  }

  return { cart, total, addToCart, decQty, incQty, updateComment, clearCart, setCart };
}
import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  /* ================= ADD TO CART ================= */
  function addToCart(product) {
    setCart((prev) => {
      const exists = prev.find(
        (p) =>
          p.id === product.id &&
          (p.size ?? null) === (product.size ?? null)
      );

      if (exists) {
        return prev.map((p) =>
          p.id === product.id &&
          (p.size ?? null) === (product.size ?? null)
            ? { ...p, qty: p.qty + 1 }
            : p
        );
      }

      return [
        ...prev,
        {
          ...product,
          size: product.size ?? null,
          qty: 1,
        },
      ];
    });
  }

  /* ================= REMOVE ITEM ================= */
  function removeFromCart(id, size = null) {
    setCart((prev) =>
      prev.filter(
        (p) =>
          !(
            p.id === id &&
            (p.size ?? null) === (size ?? null)
          )
      )
    );
  }

  /* ================= CLEAR CART ================= */
  function clearCart() {
    setCart([]);
  }

  /* ================= TOTALS ================= */
  const totalItems = cart.reduce((sum, p) => sum + p.qty, 0);

  const totalPrice = cart.reduce(
    (sum, p) => sum + p.qty * Number(p.price || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

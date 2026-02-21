import { createContext, useContext, useState, useMemo } from "react";
import ConfirmModal from "../components/ConfirmModal";

const CartContext = createContext();

const MIN_ORDER_AMOUNT = 10000;

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  /* ================= MODAL ================= */
  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "OK",
    danger: false,
    showCancel: false,
    onConfirm: () => {},
  });

  const closeModal = () =>
    setModal((m) => ({ ...m, open: false }));

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

  /* ================= REMOVE ================= */
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

  function clearCart() {
    setCart([]);
  }

  /* ================= TOTALS ================= */
  const totalItems = cart.reduce((s, p) => s + p.qty, 0);

  const subtotal = cart.reduce(
    (s, p) => s + p.qty * Number(p.price || 0),
    0
  );

  /* ================= WAYBILL ================= */
  const waybillFee = useMemo(() => {
    if (totalItems === 0) return 0;
    if (totalItems === 1) return 3500;
    if (totalItems === 2) return 4000;
    return 5000;
  }, [totalItems]);

  const totalPrice = subtotal + waybillFee;

  /* ================= CHECKOUT GUARD ================= */
  function attemptCheckout() {
    if (subtotal < MIN_ORDER_AMOUNT) {
      setModal({
        open: true,
        title: "Minimum Order Required",
        message: "You must order at least ₦10,000 before checkout.",
        confirmText: "Continue Shopping",
        onConfirm: closeModal,
      });
      return false;
    }
    return true;
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        waybillFee,
        totalPrice,
        attemptCheckout,
      }}
    >
      {children}
      <ConfirmModal {...modal} onCancel={closeModal} />
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

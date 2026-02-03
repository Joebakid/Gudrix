import { useState, useMemo } from "react";
import { NavLink, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { logEvent } from "../lib/analytics";
import { FiShoppingCart } from "react-icons/fi";

const WHATSAPP_NUMBER = "2349030388589";
const MIN_ORDER_AMOUNT = 8000;

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition
   ${isActive ? "bg-black text-white" : "hover:bg-neutral-100"}`;

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const {
    cart,
    removeFromCart,
    totalItems,
    attemptCheckout,
    clearCart,
  } = useCart();

  /* ================= SUBTOTAL ================= */
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, p) => sum + p.qty * Number(p.price || 0),
        0
      ),
    [cart]
  );

  /* ================= WAYBILL ================= */
  const waybillFee = useMemo(() => {
    const qty = totalItems;
    if (qty <= 1) return 3500;
    if (qty === 2) return 4000;
    return 4200;
  }, [totalItems]);

  /* ================= TOTAL ================= */
  const totalPrice = subtotal + (cart.length ? waybillFee : 0);

  const canCheckout = subtotal >= MIN_ORDER_AMOUNT;

  /* ================= CHECKOUT ================= */
  function checkout() {
    if (!cart.length) return;

    if (!canCheckout) {
      attemptCheckout();
      return;
    }

    logEvent("checkout_click", {
      itemsCount: cart.length,
      subtotal,
      waybillFee,
      totalPrice,
    });

    const message = cart
      .map(
        (p, index) => `
${index + 1}. ${p.name}
${p.size ? `Size: ${p.size}` : ""}
Qty: ${p.qty}
Unit Price: ₦${Number(p.price).toLocaleString()}
Subtotal: ₦${(
          p.qty * Number(p.price)
        ).toLocaleString()}
Image: ${p.imageUrl}
        `
      )
      .join("\n");

    const finalMessage = `
Hello, I want to order the following items:

${message}

Subtotal: ₦${subtotal.toLocaleString()}
Waybill: ₦${waybillFee.toLocaleString()}
Total: ₦${totalPrice.toLocaleString()}
    `;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      finalMessage
    )}`;

    window.open(url, "_blank");
    clearCart();
    setOpen(false);
  }

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <nav className="w-full border-b bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/shop" className="font-bold text-lg tracking-wide">
            Gudrix
          </Link>

          <div className="flex gap-2 items-center">
            <NavLink to="/shop" className={linkClass}>
              Shop
            </NavLink>

            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>

            {/* 🛒 CART */}
            <button
              onClick={() => setOpen(true)}
              className="relative ml-1 p-2 rounded-lg hover:bg-neutral-100"
            >
              <FiShoppingCart className="text-xl" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full px-1 min-w-[18px] text-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ================= CART DRAWER ================= */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex justify-end"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-80 max-w-full h-full p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Your Cart</h3>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>

            {/* ITEMS */}
            <div className="flex-1 space-y-3 overflow-auto">
              {cart.map((p) => (
                <div
                  key={`${p.id}-${p.size}`}
                  className="flex gap-3 text-sm items-center"
                >
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-12 h-12 rounded object-cover"
                  />

                  <div className="flex-1">
                    <p className="font-medium">{p.name}</p>
                    {p.size && (
                      <p className="text-xs text-neutral-500">
                        Size: {p.size}
                      </p>
                    )}
                    <p className="text-xs text-neutral-500">
                      Qty: {p.qty} × ₦
                      {Number(p.price).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      removeFromCart(p.id, p.size)
                    }
                    className="text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {cart.length === 0 && (
                <p className="text-sm text-neutral-500 text-center mt-10">
                  Your cart is empty.
                </p>
              )}
            </div>

            {/* FOOTER */}
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Waybill</span>
                <span>₦{waybillFee.toLocaleString()}</span>
              </div>

              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₦{totalPrice.toLocaleString()}</span>
              </div>

              {/* ✅ WHATSAPP BUTTON */}
              <button
                onClick={checkout}
                className={`w-full py-2 rounded-lg text-white transition
                  ${
                    canCheckout
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-green-600/40 cursor-not-allowed"
                  }`}
              >
                Checkout on WhatsApp
              </button>

              {!canCheckout && (
                <p className="text-xs text-neutral-500 text-center">
                  Minimum order is ₦10,000
                </p>
              )}

              <button
                onClick={() => setOpen(false)}
                className="w-full text-sm underline text-neutral-600"
              >
                Continue shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

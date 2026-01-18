import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { logEvent } from "../lib/analytics"; // ✅ Analytics

const WHATSAPP_NUMBER = "2349037291405";

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition
   ${isActive ? "bg-black text-white" : "hover:bg-neutral-100"}`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { cart, removeFromCart, totalItems, totalPrice, clearCart } =
    useCart();

  function checkout() {
    if (!cart.length) return;

    // ✅ Track checkout click
    logEvent("checkout_click", {
      itemsCount: cart.length,
      cartTotal: totalPrice,
      products: cart.map((p) => ({
        id: p.id,
        name: p.name,
        qty: p.qty,
        price: p.price,
      })),
    });

    const message = cart
      .map(
        (p, index) => `
${index + 1}. ${p.name}
Qty: ${p.qty}
Unit Price: ₦${p.price.toLocaleString()}
Subtotal: ₦${(p.qty * p.price).toLocaleString()}
Image: ${p.imageUrl}
        `
      )
      .join("\n");

    const finalMessage = `
Hello, I want to order the following items:

${message}

Total Amount: ₦${totalPrice.toLocaleString()}
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
      {/* Navbar */}
      <nav className="w-full border-b bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/shop" className="font-bold text-lg tracking-wide">
            Gudrix
          </Link>

          {/* Links */}
          <div className="flex gap-2 items-center">
            <NavLink to="/shop" className={linkClass}>
              Shop
            </NavLink>

            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>

            {/* Cart Button */}
            <button
              onClick={() => setOpen(true)}
              className="relative text-lg ml-1"
              aria-label="Open cart"
            >
              🛒
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full px-1 min-w-[18px] text-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Cart Drawer */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex justify-end"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-80 max-w-full h-full p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Your Cart</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 space-y-3 overflow-auto">
              {cart.map((p) => (
                <div
                  key={p.id}
                  className="flex gap-3 text-sm items-center"
                >
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-12 h-12 rounded object-cover"
                  />

                  <div className="flex-1">
                    <p className="font-medium leading-tight">
                      {p.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Qty: {p.qty} × ₦{p.price.toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => removeFromCart(p.id)}
                    className="text-red-500 hover:text-red-600"
                    title="Remove item"
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

            {/* Footer */}
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₦{totalPrice.toLocaleString()}</span>
              </div>

              <button
                disabled={!cart.length}
                onClick={checkout}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Checkout on WhatsApp
              </button>

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

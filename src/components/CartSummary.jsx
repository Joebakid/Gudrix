import { useState } from "react";
import { useCart } from "../context/CartContext";
import PaystackCheckout from "./PaystackCheckout";

const WHATSAPP_NUMBER = "2349030388589";
const MIN_ORDER_AMOUNT = 10000;

export default function CartSummary({ closeDrawer }) {
  const {
    cart,
    subtotal,
    waybillFee,
    totalPrice,
    attemptCheckout,
    clearCart,
  } = useCart();

  const [customer, setCustomer] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });

  const canCheckout = subtotal >= MIN_ORDER_AMOUNT;

  function handleChange(e) {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  }

  return (
    <div className="border-t pt-3 space-y-3">

      {/* TOTALS */}
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

      {/* CUSTOMER FORM */}
      {cart.length > 0 && (
        <div className="space-y-2 mt-3">
          <input
            name="fullName"
            placeholder="Full Name"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            onChange={handleChange}
          />
          <input
            name="email"
            placeholder="Email"
            type="email"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            onChange={handleChange}
          />
          <input
            name="phone"
            placeholder="Phone Number"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            onChange={handleChange}
          />
          <textarea
            name="address"
            placeholder="Delivery Address"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            onChange={handleChange}
          />
        </div>
      )}

      {/* PAYSTACK */}
      {cart.length > 0 && (
        <PaystackCheckout customer={customer} />
      )}

      {!canCheckout && (
        <p className="text-xs text-neutral-500 text-center">
          Minimum order is ₦10,000
        </p>
      )}

      <button
        onClick={closeDrawer}
        className="w-full text-sm underline text-neutral-600"
      >
        Continue shopping
      </button>
    </div>
  );
}
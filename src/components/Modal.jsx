import { useState } from "react";
import { useCart } from "../context/CartContext";

export default function PaystackCheckout({ customer }) {
  const {
    cart,
    subtotal,
    waybillFee,
    totalPrice,
    clearCart,
    attemptCheckout,
  } = useCart();

  const [loading, setLoading] = useState(false);

  const payWithPaystack = () => {
    if (!customer?.email || !customer?.fullName || !customer?.phone) {
      alert("Please complete your details before paying.");
      return;
    }

    if (!attemptCheckout()) return;

    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY, // must be pk_test or pk_live
      email: customer.email,
      amount: totalPrice * 100, // convert to kobo
      currency: "NGN",
      ref: Date.now().toString(),

      metadata: {
        custom_fields: [
          {
            display_name: "Full Name",
            variable_name: "full_name",
            value: customer.fullName,
          },
          {
            display_name: "Phone",
            variable_name: "phone",
            value: customer.phone,
          },
        ],
      },

      callback: function (response) {
        verifyPayment(response.reference);
      },

      onClose: function () {
        setLoading(false);
      },
    });

    handler.openIframe();
  };

  const verifyPayment = async (reference) => {
    try {
      setLoading(true);

      const res = await fetch("/api/paystack-verify", {   // ✅ CHANGED HERE
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          cart,
          subtotal,
          waybill: waybillFee,
          total: totalPrice,
          customer,
        }),
      });

      if (!res.ok) throw new Error("Verification failed");

      const data = await res.json();

      if (!data.success) throw new Error("Payment not successful");

      clearCart();
      alert("Payment successful 🎉");
    } catch (err) {
      console.error(err);
      alert("Verification failed. Contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={payWithPaystack}
      disabled={loading}
      className="w-full bg-black text-white py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition"
    >
      {loading ? "Processing..." : `Pay ₦${totalPrice.toLocaleString()}`}
    </button>
  );
}
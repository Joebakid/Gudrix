import { useState } from "react";
import { useCart } from "../context/CartContext";
import Modal from "./Modal";

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
  const [modal, setModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const payWithPaystack = () => {
    if (!customer?.email || !customer?.fullName || !customer?.phone) {
      setModal({
        open: true,
        type: "error",
        title: "Incomplete Details",
        message: "Please complete your details before paying.",
      });
      return;
    }

    if (!attemptCheckout()) return;

    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: customer.email,
      amount: totalPrice * 100,
      currency: "NGN",
      ref: Date.now().toString(),
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

      const res = await fetch("/api/paystack-verify", {
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

      if (!res.ok) throw new Error();

      const data = await res.json();
      if (!data.success) throw new Error();

      clearCart();

      setModal({
        open: true,
        type: "success",
        title: "Payment Successful 🎉",
        message: "Your order has been received successfully.",
      });
    } catch (err) {
      setModal({
        open: true,
        type: "error",
        title: "Payment Failed",
        message: "Verification failed. Contact support.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={payWithPaystack}
        disabled={loading}
        className="w-full bg-black text-white py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition"
      >
        {loading ? "Processing..." : `Pay ₦${totalPrice.toLocaleString()}`}
      </button>

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ ...modal, open: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </>
  );
}
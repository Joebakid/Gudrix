import { useState } from "react";
import { useCart } from "../context/CartContext";
import ConfirmModal from "./ConfirmModal";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    title: "",
    message: "",
    success: false,
  });

  const payWithPaystack = () => {
    if (!customer?.email || !customer?.fullName || !customer?.phone) {
      setModalData({
        title: "Incomplete Details",
        message: "Please complete your details before paying.",
        success: false,
      });
      setModalOpen(true);
      return;
    }

    if (!attemptCheckout()) return;

    setLoading(true);

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

      // Show success modal FIRST
      setModalData({
        title: "Payment Successful 🎉",
        message: "Your order has been received successfully.",
        success: true,
      });

      setModalOpen(true);
    } catch (err) {
      setModalData({
        title: "Payment Failed",
        message: "Verification failed. Contact support.",
        success: false,
      });
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleModalConfirm = () => {
    // If payment was successful, clear cart AFTER user sees modal
    if (modalData.success) {
      clearCart();
    }

    setModalOpen(false);
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

      <ConfirmModal
        open={modalOpen}
        title={modalData.title}
        message={modalData.message}
        confirmText="OK"
        onConfirm={handleModalConfirm}
      />
    </>
  );
}
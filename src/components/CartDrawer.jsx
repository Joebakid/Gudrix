import { useCart } from "../context/CartContext";
import CartItem from "./CartItem";
import CartSummary from "./CartSummary";

export default function CartDrawer({ open, setOpen }) {
  const { cart } = useCart();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex justify-end"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white w-80 max-w-full h-full p-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Your Cart</h3>
          <button onClick={() => setOpen(false)}>✕</button>
        </div>

        <div className="flex-1 space-y-3 overflow-auto">
          {cart.length === 0 && (
            <p className="text-sm text-neutral-500 text-center mt-10">
              Your cart is empty.
            </p>
          )}

          {cart.map((item) => (
            <CartItem key={`${item.id}-${item.size}`} item={item} />
          ))}
        </div>

        <CartSummary closeDrawer={() => setOpen(false)} />
      </div>
    </div>
  );
}
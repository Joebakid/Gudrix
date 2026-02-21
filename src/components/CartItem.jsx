import { useCart } from "../context/CartContext";

export default function CartItem({ item }) {
  const { removeFromCart } = useCart();

  return (
    <div className="flex gap-3 text-sm items-center">
      <img
        src={item.imageUrl}
        alt={item.name}
        className="w-12 h-12 rounded object-cover"
      />

      <div className="flex-1">
        <p className="font-medium">{item.name}</p>

        {item.size && (
          <p className="text-xs text-neutral-500">
            Size: {item.size}
          </p>
        )}

        <p className="text-xs text-neutral-500">
          Qty: {item.qty} × ₦{Number(item.price).toLocaleString()}
        </p>
      </div>

      <button
        onClick={() => removeFromCart(item.id, item.size)}
        className="text-red-500"
      >
        ✕
      </button>
    </div>
  );
}
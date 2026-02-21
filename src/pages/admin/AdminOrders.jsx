import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.seconds
    ? new Date(ts.seconds * 1000)
    : new Date(ts);
  return d.toLocaleString();
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })));
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-8">Orders</h2>

      {orders.length === 0 && (
        <p className="text-neutral-500">No orders yet.</p>
      )}

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border rounded-xl p-5 bg-white shadow-sm space-y-4"
          >
            {/* CUSTOMER INFO */}
            <div className="text-sm space-y-1">
              <p><strong>Name:</strong> {order.customer?.fullName}</p>
              <p><strong>Email:</strong> {order.customer?.email}</p>
              <p><strong>Phone:</strong> {order.customer?.phone}</p>
              <p><strong>Address:</strong> {order.customer?.address}</p>
              <p><strong>Total:</strong> ₦{order.total}</p>
            </div>

            {/* ITEMS */}
            <div className="border-t pt-4 space-y-3">
              {order.cart?.map((item, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />

                  <div className="text-sm">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-neutral-500">
                      Qty: {item.quantity || 1}
                      {item.size && ` • Size: ${item.size}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* DATE */}
            <p className="text-xs text-neutral-400">
              {formatDate(order.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
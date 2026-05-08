import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

export default function Account() {
  const { user, userData } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const ordersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersList);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (!user) return <div className="p-10 text-center">Please login to view your account.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Welcome, {userData?.fullName || user.email}</h1>
      <p className="text-gray-500 mb-8">Manage your info and view your order history.</p>

      <section>
        <h2 className="text-xl font-semibold mb-4">Order History</h2>
        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p>You haven't placed any orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="border p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">Order #{order.reference}</p>
                  <p className="text-sm text-gray-500">
                    {order.createdAt?.toDate().toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₦{order.total.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-1 rounded ${order.status === 'pending' ? 'bg-yellow-100' : 'bg-green-100'}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
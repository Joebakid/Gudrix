import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import {
  collection, query, where, getDocs,
  orderBy, doc, getDoc,
} from "firebase/firestore";
import { FaHeart } from "react-icons/fa";
import { useCart } from "../context/CartContext";

const SIZE_CATEGORIES = ["footwears", "shoes", "heels", "home-made-accessories"];
const AVAILABLE_SIZES = [40, 41, 42, 43, 44, 45, 46];

export default function Account() {
  const { user, userData, starred, toggleStar } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [starredProducts, setStarredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starsLoading, setStarsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [fullImage, setFullImage] = useState(null);

  // ✅ Redirect admins to /admin
  useEffect(() => {
    if (userData?.isAdmin === true) {
      navigate("/admin", { replace: true });
    }
  }, [userData, navigate]);

  // Fetch orders
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
        setOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  // Fetch starred product details
  useEffect(() => {
    if (!starred || starred.length === 0) {
      setStarredProducts([]);
      setStarsLoading(false);
      return;
    }
    const fetchStarred = async () => {
      setStarsLoading(true);
      try {
        const results = await Promise.all(
          starred.map((id) => getDoc(doc(db, "products", id)))
        );
        setStarredProducts(
          results
            .filter((d) => d.exists())
            .map((d) => ({ id: d.id, ...d.data() }))
        );
      } catch (err) {
        console.error("Error fetching starred:", err);
      } finally {
        setStarsLoading(false);
      }
    };
    fetchStarred();
  }, [starred]);

  function productNeedsSize(product) {
    return SIZE_CATEGORIES.includes(product.category);
  }

  function openProduct(product) {
    setSelectedProduct(product);
    setSelectedSize(null);
  }

  function handleAddToCart(product) {
    const needsSize = productNeedsSize(product);
    if (needsSize && !selectedSize) {
      alert("Please select a size before adding to cart.");
      return;
    }
    addToCart({ ...product, size: needsSize ? selectedSize : null });
    setSelectedSize(null);
    setSelectedProduct(null);
  }

  if (!user) return (
    <div className="p-10 text-center">Please login to view your account.</div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">
        Welcome, {userData?.fullName || user.email}
      </h1>
      <p className="text-gray-500 mb-8">Manage your info and view your order history.</p>

      {/* ── SAVED PRODUCTS ── */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <FaHeart className="text-red-500" />
          <h2 className="text-xl font-semibold">Saved Products</h2>
          {starred.length > 0 && (
            <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-medium">
              {starred.length}
            </span>
          )}
        </div>

        {starsLoading ? (
          <p className="text-sm text-gray-400">Loading saved products...</p>
        ) : starredProducts.length === 0 ? (
          <p className="text-sm text-gray-400">
            No saved products yet. Tap the ♡ on any product to save it.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {starredProducts.map((p) => (
              <div
                key={p.id}
                className="border rounded-xl overflow-hidden bg-white relative cursor-pointer hover:shadow-md transition"
                onClick={() => openProduct(p)}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggleStar(p.id); }}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 shadow-sm hover:scale-110 transition"
                >
                  <FaHeart className="text-red-500 text-sm" />
                </button>
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-32 object-cover"
                />
                <div className="p-3">
                  <p className="font-medium text-sm line-clamp-1">{p.name}</p>
                  <p className="text-sm text-gray-600 mb-2">
                    ₦{p.price?.toLocaleString()}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); openProduct(p); }}
                    className="w-full text-xs bg-black text-white py-1.5 rounded-lg hover:opacity-90 transition"
                  >
                    View & Buy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── ORDER HISTORY ── */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Order History</h2>
        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-gray-400">You haven't placed any orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border p-4 rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">Order #{order.reference}</p>
                  <p className="text-sm text-gray-500">
                    {order.createdAt?.toDate().toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₦{order.total.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    order.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── PRODUCT MODAL ── */}
      {selectedProduct && (
        <div
          onClick={() => setSelectedProduct(null)}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-3"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl max-w-md w-full p-5 relative"
          >
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-3 right-3 text-xs bg-black text-white py-1 px-2 rounded"
            >
              CLOSE
            </button>

            <img
              src={selectedProduct.imageUrl}
              onClick={() => setFullImage(selectedProduct.imageUrl)}
              className="w-full max-h-[280px] object-cover rounded-lg mb-4 cursor-zoom-in"
            />

            <h3 className="font-bold text-lg">{selectedProduct.name}</h3>
            <p className="text-sm mb-1">₦{selectedProduct.price.toLocaleString()}</p>
            <p className="text-xs text-neutral-500 mb-3">
              Stock: {selectedProduct.stock ?? "Available"}
            </p>

            {productNeedsSize(selectedProduct) && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Select Size</p>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 rounded border text-sm ${
                        selectedSize === size
                          ? "bg-black text-white"
                          : "bg-white hover:bg-neutral-100"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => handleAddToCart(selectedProduct)}
              className="w-full bg-black text-white py-2 rounded-lg hover:opacity-90 transition"
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}

      {/* ── FULL IMAGE ── */}
      {fullImage && (
        <div
          onClick={() => setFullImage(null)}
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 cursor-zoom-out p-3"
        >
          <img
            src={fullImage}
            className="max-h-[95vh] max-w-[95vw] object-contain rounded-lg shadow-xl"
          />
        </div>
      )}
    </div>
  );
}
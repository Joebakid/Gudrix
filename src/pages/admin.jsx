import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState(1);
  const [category, setCategory] = useState("shoes");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔐 Protect admin route
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
      } else {
        setUser(currentUser);
      }
    });

    return () => unsub();
  }, []);

  // 📦 Fetch products live (newest first)
  useEffect(() => {
    const q = query(
      collection(db, "products"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setProducts(items);
    });

    return () => unsub();
  }, []);

  // ➕ Add product
  async function handleSubmit(e) {
    e.preventDefault();
    if (!imageUrl.trim()) return alert("Please paste an image URL");

    try {
      setLoading(true);

      await addDoc(collection(db, "products"), {
        name: name.trim(),
        price: Number(price),
        stock: Number(stock),
        category,
        imageUrl: imageUrl.trim(),
        createdAt: serverTimestamp(),
      });

      alert("✅ Product added successfully!");

      // Reset form
      setName("");
      setPrice("");
      setStock(1);
      setCategory("shoes");
      setImageUrl("");
    } catch (err) {
      console.error(err);
      alert("❌ Error adding product");
    } finally {
      setLoading(false);
    }
  }

  // 🗑 Delete product
  async function deleteProduct(id) {
    const ok = window.confirm("Delete this product?");
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "products", id));
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete product");
    }
  }

  if (!user) {
    return (
      <div className="p-10 text-center text-neutral-500">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>

        <button
          onClick={() => signOut(auth)}
          className="text-sm text-red-500 hover:underline"
        >
          Logout
        </button>
      </div>

      {/* Add Product Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 border rounded-xl p-5 bg-white shadow-sm"
      >
        <input
          placeholder="Product name"
          className="w-full border rounded-lg px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="number"
          min="0"
          placeholder="Price"
          className="w-full border rounded-lg px-3 py-2"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <input
          type="number"
          min="0"
          placeholder="Stock quantity"
          className="w-full border rounded-lg px-3 py-2"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          required
        />

        <select
          className="w-full border rounded-lg px-3 py-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="shoes">Shoes</option>
          <option value="slides">Slides</option>
          <option value="heels">Heels</option>
        </select>

        <input
          type="url"
          placeholder="Image URL (paste link)"
          className="w-full border rounded-lg px-3 py-2"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          required
        />

        <button
          disabled={loading}
          className="w-full bg-black text-white rounded-lg py-2 hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Add Product"}
        </button>
      </form>

      {/* Products List */}
      <div className="mt-10">
        <h3 className="font-semibold mb-3">Products</h3>

        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 border rounded-lg p-2"
            >
              <img
                src={p.imageUrl}
                alt={p.name}
                className="w-14 h-14 object-cover rounded"
              />

              <div className="flex-1">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-neutral-500 capitalize">
                  ₦{p.price.toLocaleString()} • Stock: {p.stock ?? 0} •{" "}
                  {p.category}
                </p>
              </div>

              <button
                onClick={() => deleteProduct(p.id)}
                className="text-xs text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <p className="text-sm text-neutral-500 mt-4">
            No products yet.
          </p>
        )}
      </div>
    </div>
  );
}

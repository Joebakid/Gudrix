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
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { Routes, Route, Link } from "react-router-dom";

// ✅ Analytics page
import AdminAnalytics from "./admin/AdminAnalytics";

/* ---------------- Image Preview Modal ---------------- */
function ImageModal({ src, onClose }) {
  if (!src) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
    >
      <img
        src={src}
        alt="Preview"
        className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-xl"
      />
    </div>
  );
}

/* ---------------- Category Block ---------------- */
function CategoryBlock({ title, items, onDelete, onPreview }) {
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState("");
  const [tempPrice, setTempPrice] = useState("");
  const [tempCategory, setTempCategory] = useState("");
  const [tempImageUrl, setTempImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit(product) {
    setEditingId(product.id);
    setTempName(product.name);
    setTempPrice(product.price);
    setTempCategory(product.category);
    setTempImageUrl(product.imageUrl || "");
  }

  async function saveEdit(productId) {
    if (!tempName.trim()) return alert("Name cannot be empty");
    if (Number(tempPrice) < 0) return alert("Price must be valid");

    try {
      setSaving(true);
      const ref = doc(db, "products", productId);

      await updateDoc(ref, {
        name: tempName.trim(),
        price: Number(tempPrice),
        category: tempCategory,
        imageUrl: tempImageUrl.trim(),
      });

      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update product");
    } finally {
      setSaving(false);
    }
  }

  if (!items.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">{title}</h3>

      {items.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-3 border rounded-lg p-2"
        >
          {/* ✅ Clickable Image */}
          <img
            src={p.imageUrl}
            alt={p.name}
            onClick={() => onPreview(p.imageUrl)}
            className="w-14 h-14 object-cover rounded cursor-pointer hover:opacity-80"
          />

          <div className="flex-1">
            {editingId === p.id ? (
              <div className="space-y-2">
                <input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                  placeholder="Product name"
                  autoFocus
                />

                <input
                  type="number"
                  min="0"
                  value={tempPrice}
                  onChange={(e) => setTempPrice(e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                  placeholder="Price"
                />

                {/* ✅ Image URL Editor */}
                <input
                  value={tempImageUrl}
                  onChange={(e) => setTempImageUrl(e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                  placeholder="Image URL"
                />

                {/* ✅ Live Preview */}
                {tempImageUrl && (
                  <img
                    src={tempImageUrl}
                    onClick={() => onPreview(tempImageUrl)}
                    className="w-20 h-20 object-cover rounded cursor-pointer border"
                  />
                )}

                <select
                  value={tempCategory}
                  onChange={(e) => setTempCategory(e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="shoes">Shoes</option>
                  <option value="slides">Slides</option>
                  <option value="heels">Heels</option>
                  <option value="jewelry">Jewelry</option>
                </select>

                <div className="flex gap-2">
                  <button
                    disabled={saving}
                    onClick={() => saveEdit(p.id)}
                    className="text-xs bg-green-600 text-white px-3 py-1 rounded"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>

                  <button
                    onClick={() => setEditingId(null)}
                    className="text-xs text-neutral-500 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-neutral-500 capitalize">
                  ₦{p.price.toLocaleString()} • {p.category} • Stock:{" "}
                  {p.stock ?? 0}
                </p>
              </>
            )}
          </div>

          {editingId !== p.id && (
            <button
              onClick={() => startEdit(p)}
              className="text-xs text-blue-600 hover:underline"
            >
              Edit
            </button>
          )}

          <button
            onClick={() => onDelete(p.id)}
            className="text-xs text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Admin Dashboard Page ---------------- */
function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [previewImage, setPreviewImage] = useState(null); // ✅ Modal image

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState(1);
  const [category, setCategory] = useState("shoes");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔐 Protect admin route
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) window.location.href = "/login";
      else setUser(currentUser);
    });
    return () => unsub();
  }, []);

  // 📦 Fetch products live
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

  async function deleteProduct(id) {
    if (!window.confirm("Delete this product?")) return;
    await deleteDoc(doc(db, "products", id));
  }

  if (!user) {
    return (
      <div className="p-10 text-center text-neutral-500">
        Checking authentication...
      </div>
    );
  }

  /* ---------------- PAGINATION ---------------- */

  const totalPages = Math.ceil(products.length / PAGE_SIZE) || 1;

  const paginatedProducts = products.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  /* ---------------- AUTO SORT CATEGORIES ---------------- */

  const categoryMap = paginatedProducts.reduce((acc, product) => {
    const cat = product.category || "others";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryMap)
    .map(([category, items]) => {
      const latest = Math.max(
        ...items.map((p) =>
          p.createdAt?.seconds ? p.createdAt.seconds * 1000 : 0
        )
      );
      return { category, items, latest };
    })
    .sort((a, b) => b.latest - a.latest);

  const categoryTitles = {
    shoes: "👟 Shoes",
    slides: "🩴 Slides",
    heels: "👠 Heels",
    jewelry: "💍 Jewelry",
    others: "📦 Others",
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      {/* Image Viewer */}
      <ImageModal
        src={previewImage}
        onClose={() => setPreviewImage(null)}
      />

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
          <option value="jewelry">Jewelry</option>
        </select>

        <input
          type="url"
          placeholder="Image URL (paste link)"
          className="w-full border rounded-lg px-3 py-2"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          required
        />

        {/* ✅ Live Preview when adding */}
        {imageUrl && (
          <img
            src={imageUrl}
            onClick={() => setPreviewImage(imageUrl)}
            className="w-24 h-24 object-cover rounded cursor-pointer border"
          />
        )}

        <button
          disabled={loading}
          className="w-full bg-black text-white rounded-lg py-2"
        >
          {loading ? "Saving..." : "Add Product"}
        </button>
      </form>

      {/* Categories */}
      <div className="mt-12 space-y-10">
        {sortedCategories.map(({ category, items }) => (
          <CategoryBlock
            key={category}
            title={categoryTitles[category] || category}
            items={items}
            onDelete={deleteProduct}
            onPreview={setPreviewImage}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 border rounded disabled:opacity-40"
          >
            ◀ Prev
          </button>

          <span className="text-sm">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border rounded disabled:opacity-40"
          >
            Next ▶
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Main Admin Router ---------------- */
export default function Admin() {
  return (
    <div>
      <div className="container-app">
        <div className="flex gap-4 p-4 border-b">
          <Link to="/admin" className="font-medium underline">
            Dashboard
          </Link>
          <Link to="/admin/analytics" className="font-medium underline">
            Analytics
          </Link>
        </div>
      </div>

      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="analytics" element={<AdminAnalytics />} />
      </Routes>
    </div>
  );
}

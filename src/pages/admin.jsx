import { useEffect, useState, useMemo } from "react";
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

/* ---------------- DATE FORMATTER ---------------- */
function formatDate(ts) {
  if (!ts) return "—";

  try {
    const date =
      ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);

    return date.toLocaleString("en-US", {
      month: "short",     // Jan
      weekday: "long",    // Tuesday
      year: "numeric",    // 2025
      hour: "numeric",    // 10
      minute: "2-digit",  // 42
      hour12: true,
    });
  } catch {
    return "—";
  }
}

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
          <img
            src={p.imageUrl}
            alt={p.name}
            onClick={() => onPreview(p.imageUrl)}
            className="w-14 h-14 object-cover rounded cursor-pointer"
          />

          <div className="flex-1">
            {editingId === p.id ? (
              <div className="space-y-2">
                <input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                />

                <input
                  type="number"
                  min="0"
                  value={tempPrice}
                  onChange={(e) => setTempPrice(e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                />

                <input
                  value={tempImageUrl}
                  onChange={(e) => setTempImageUrl(e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                />

                {tempImageUrl && (
                  <img
                    src={tempImageUrl}
                    onClick={() => onPreview(tempImageUrl)}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                    className="w-20 h-20 object-cover rounded border cursor-pointer"
                  />
                )}

                <select
                  value={tempCategory}
                  onChange={(e) => setTempCategory(e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="shoes">Shoes</option>
                  <option value="footwears">Footwears</option>
                  <option value="heels">Heels</option>
                  <option value="jewelry">Jewelry</option>
                   <option value="home-made-accessories">
    Home Made Accessories
  </option>
                </select>

                <button
                  disabled={saving}
                  onClick={() => saveEdit(p.id)}
                  className="text-xs bg-green-600 text-white px-3 py-1 rounded"
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-neutral-500 capitalize">
                  ₦{p.price.toLocaleString()} • {p.category}
                </p>

                {/* ✅ Upload timestamp */}
                <p className="text-[11px] text-neutral-400">
                  Uploaded:{" "}
                  {formatDate(p.createdAt || p.clientCreatedAt)}
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

/* ---------------- Admin Dashboard ---------------- */
function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  const [rows, setRows] = useState([
    { name: "", price: "", imageUrl: "", stock: 1 },
  ]);
  const [category, setCategory] = useState("shoes");
  const [saving, setSaving] = useState(false);

  // 🔐 Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) window.location.href = "/login";
      else setUser(currentUser);
    });
    return () => unsub();
  }, []);

  // 📦 Products
  useEffect(() => {
    const q = query(
      collection(db, "products"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setProducts(items);
    });
  }, []);

  const filteredProducts = useMemo(() => {
    const base =
      filter === "all"
        ? products
        : products.filter((p) => p.category === filter);

    return [...base].sort((a, b) => {
      const at =
        a.createdAt?.seconds
          ? a.createdAt.seconds * 1000
          : a.clientCreatedAt || 0;
      const bt =
        b.createdAt?.seconds
          ? b.createdAt.seconds * 1000
          : b.clientCreatedAt || 0;
      return bt - at;
    });
  }, [products, filter]);

  const totalPages =
    Math.ceil(filteredProducts.length / PAGE_SIZE) || 1;

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      (page - 1) * PAGE_SIZE,
      page * PAGE_SIZE
    );
  }, [filteredProducts, page]);

  const groupedProducts = useMemo(() => {
    return paginatedProducts.reduce((acc, p) => {
      const cat = p.category || "others";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    }, {});
  }, [paginatedProducts]);

  function updateRow(index, field, value) {
    setRows((rows) =>
      rows.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }

  function addRow() {
    setRows((r) => [
      ...r,
      { name: "", price: "", imageUrl: "", stock: 1 },
    ]);
  }

  function removeRow(index) {
    setRows((r) => r.filter((_, i) => i !== index));
  }

  async function saveAll() {
    const validRows = rows.filter(
      (r) => r.name && r.price && r.imageUrl
    );

    if (!validRows.length) {
      alert("Please fill at least one product row.");
      return;
    }

    if (!window.confirm(`Save ${validRows.length} products?`))
      return;

    try {
      setSaving(true);

      await Promise.all(
        validRows.map((r) =>
          addDoc(collection(db, "products"), {
            name: r.name.trim(),
            price: Number(r.price),
            stock: Number(r.stock || 1),
            imageUrl: r.imageUrl.trim(),
            category,
            createdAt: serverTimestamp(),
            clientCreatedAt: Date.now(),
          })
        )
      );

      setRows([
        { name: "", price: "", imageUrl: "", stock: 1 },
      ]);
      alert("✅ Products saved successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save products");
    } finally {
      setSaving(false);
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

 const categoryTitles = {
  shoes: "Shoes",
  footwears: "Footwears",
  heels: "Heels",
  jewelry: "Jewelry",
  "home-made-accessories": "Home Made Accessories",
  others: "Others",
};


  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <ImageModal
        src={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <button
          onClick={() => signOut(auth)}
          className="text-sm text-red-500 hover:underline"
        >
          Logout
        </button>
      </div>

      {/* FILTER */}
      <select
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value);
          setPage(1);
        }}
        className="w-full mb-6 border rounded-lg px-3 py-2"
      >
        <option value="all">All Products</option>
        <option value="shoes">Shoes</option>
        <option value="footwears"> Footwears</option>
        <option value="heels">Heels</option>
        <option value="jewelry">Jewelry</option>
      </select>

      {/* ---------------- MULTI PRODUCT FORM ---------------- */}
      <div className="border rounded-xl p-4 bg-white shadow space-y-4 mb-10">
        <h3 className="font-semibold">➕ Add Multiple Products</h3>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        >
          <option value="shoes">Shoes</option>
          <option value="footwears">Footwears</option>
          <option value="heels">Heels</option>
          <option value="jewelry">Jewelry</option>
           <option value="home-made-accessories">
    Home Made Accessories
  </option>
        </select>

        {rows.map((row, index) => (
          <div
            key={index}
            className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center"
          >
            <input
              placeholder="Name"
              value={row.name}
              onChange={(e) =>
                updateRow(index, "name", e.target.value)
              }
              className="border rounded px-2 py-1"
            />

            <input
              type="number"
              placeholder="Price"
              value={row.price}
              onChange={(e) =>
                updateRow(index, "price", e.target.value)
              }
              className="border rounded px-2 py-1"
            />

            <input
              placeholder="Image URL"
              value={row.imageUrl}
              onChange={(e) =>
                updateRow(index, "imageUrl", e.target.value)
              }
              className="border rounded px-2 py-1"
            />

            {row.imageUrl ? (
              <img
                src={row.imageUrl}
                onClick={() => setPreviewImage(row.imageUrl)}
                onError={(e) =>
                  (e.currentTarget.style.display = "none")
                }
                className="w-14 h-14 object-cover rounded cursor-pointer border"
              />
            ) : (
              <div className="w-14 h-14 border rounded flex items-center justify-center text-xs text-neutral-400">
                No Image
              </div>
            )}

            <input
              type="number"
              placeholder="Stock"
              value={row.stock}
              onChange={(e) =>
                updateRow(index, "stock", e.target.value)
              }
              className="border rounded px-2 py-1"
            />

            <button
              onClick={() => removeRow(index)}
              className="text-red-600 text-sm"
            >
              Remove
            </button>
          </div>
        ))}

        <button
          onClick={addRow}
          className="text-sm text-blue-600 hover:underline"
        >
          + Add Row
        </button>

        <button
          disabled={saving}
          onClick={saveAll}
          className="w-full bg-black text-white rounded-lg py-2"
        >
          {saving ? "Saving..." : "Save All Products"}
        </button>
      </div>

      {/* ---------------- PRODUCTS ---------------- */}

      {filter === "all" ? (
        <div className="space-y-10">
          {Object.entries(groupedProducts).map(([cat, items]) => (
            <CategoryBlock
              key={cat}
              title={categoryTitles[cat] || cat}
              items={items}
              onDelete={deleteProduct}
              onPreview={setPreviewImage}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedProducts.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 border rounded-lg p-2"
            >
              <img
                src={p.imageUrl}
                onClick={() => setPreviewImage(p.imageUrl)}
                className="w-14 h-14 object-cover rounded cursor-pointer"
              />

              <div className="flex-1">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-neutral-500 capitalize">
                  ₦{p.price.toLocaleString()} • {p.category}
                </p>

                {/* ✅ Upload timestamp */}
                <p className="text-[11px] text-neutral-400">
                  Uploaded:{" "}
                  {formatDate(p.createdAt || p.clientCreatedAt)}
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
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>

          <span className="text-sm">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-1 border rounded disabled:opacity-40"
          >
            Next
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

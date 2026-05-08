import { useEffect, useState, useRef } from "react";
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
  getDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { Routes, Route, Link } from "react-router-dom";
import AdminAnalytics from "./admin/AdminAnalytics";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/Pagination";
import AdminOrders from "./admin/AdminOrders";

/* ================= HELPERS ================= */
function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleString();
}

const CLOUD_NAME = "dmo6gk6te";
const UPLOAD_PRESET = "gudrix_products";

async function uploadImage(file) {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Upload failed");
  return data.secure_url;
}

function ImageModal({ src, onClose }) {
  if (!src) return null;
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <img src={src} alt="Preview" className="max-h-[90vh] max-w-full rounded-lg" />
    </div>
  );
}

/* ================= DASHBOARD ================= */
// ✅ No auth guard here — ProtectedAdminRoute in App.jsx handles it before this mounts
function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("shoes");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [editFile, setEditFile] = useState(null);

  const [modal, setModal] = useState({ open: false, title: "", message: "", onConfirm: () => {} });
  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  /* ---------- FETCH PRODUCTS ---------- */
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, []);

  /* ---------- ACTIONS ---------- */
  async function saveProduct() {
    if (!name || !price || !file) return alert("All fields required");
    try {
      setSaving(true);
      const imageUrl = await uploadImage(file);
      await addDoc(collection(db, "products"), {
        name,
        price: Number(price),
        category,
        imageUrl,
        createdAt: serverTimestamp(),
      });
      setName("");
      setPrice("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id) {
    setModal({
      open: true,
      title: "Delete Product",
      message: "Are you sure you want to delete this product?",
      onConfirm: async () => {
        await deleteDoc(doc(db, "products", id));
        closeModal();
      },
    });
  }

  function startEdit(product) {
    setEditingId(product.id);
    setEditData({ name: product.name, price: product.price, category: product.category });
    setEditFile(null);
  }

  async function saveEdit(id) {
    try {
      setSaving(true);
      let imageUrl = products.find((p) => p.id === id)?.imageUrl;
      if (editFile) imageUrl = await uploadImage(editFile);
      await updateDoc(doc(db, "products", id), {
        name: editData.name,
        price: Number(editData.price),
        category: editData.category,
        imageUrl,
      });
      setEditingId(null);
      setEditFile(null);
    } finally {
      setSaving(false);
    }
  }

  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const paginated = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ---------- RENDER ---------- */
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <ConfirmModal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
      />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <button onClick={() => signOut(auth)} className="text-red-500 font-medium hover:underline">
          Logout
        </button>
      </div>

      {/* ── ADD PRODUCT FORM ── */}
      <div className="bg-white border rounded-2xl p-6 mb-8 shadow-sm">
        <h3 className="font-semibold text-lg mb-4">Add New Product</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            className="border rounded-xl p-3 outline-none focus:border-black"
            placeholder="Product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="border rounded-xl p-3 outline-none focus:border-black"
            placeholder="Price (₦)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <select
            className="border rounded-xl p-3 outline-none focus:border-black"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="shoes">Shoes</option>
            <option value="shirts">Shirts</option>
            <option value="pants">Pants</option>
            <option value="accessories">Accessories</option>
          </select>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="border rounded-xl p-3 outline-none focus:border-black"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>
        {preview && (
          <img src={preview} alt="Preview" className="mt-3 h-24 rounded-lg object-cover" />
        )}
        <button
          onClick={saveProduct}
          disabled={saving}
          className="mt-4 bg-black text-white px-6 py-2.5 rounded-xl font-semibold hover:opacity-80 disabled:opacity-40 transition"
        >
          {saving ? "Uploading..." : "Add Product"}
        </button>
      </div>

      {/* ── PRODUCT LIST ── */}
      <div className="space-y-3">
        {paginated.map((product) =>
          editingId === product.id ? (
            /* ── EDIT ROW ── */
            <div key={product.id} className="border rounded-2xl p-4 bg-yellow-50 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  className="border rounded-xl p-2 outline-none focus:border-black"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
                <input
                  className="border rounded-xl p-2 outline-none focus:border-black"
                  type="number"
                  value={editData.price}
                  onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                />
                <select
                  className="border rounded-xl p-2 outline-none focus:border-black"
                  value={editData.category}
                  onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                >
                  <option value="shoes">Shoes</option>
                  <option value="shirts">Shirts</option>
                  <option value="pants">Pants</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>
              <input
                type="file"
                accept="image/*"
                className="text-sm"
                onChange={(e) => setEditFile(e.target.files[0])}
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => saveEdit(product.id)}
                  disabled={saving}
                  className="bg-black text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="border px-4 py-1.5 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* ── DISPLAY ROW ── */
            <div key={product.id} className="border rounded-2xl p-4 flex items-center gap-4 bg-white">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-14 h-14 object-cover rounded-xl cursor-pointer"
                onClick={() => setPreview(product.imageUrl)}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{product.name}</p>
                <p className="text-sm text-gray-500">
                  ₦{product.price?.toLocaleString()} · {product.category}
                </p>
                <p className="text-xs text-gray-400">{formatDate(product.createdAt)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEdit(product)}
                  className="text-sm border px-3 py-1 rounded-lg hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="text-sm text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      )}

      <ImageModal src={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

/* ================= ROUTER ================= */
export default function Admin() {
  return (
    <>
      <div className="border-b bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-8">
          <Link to="/admin" className="text-sm font-bold hover:opacity-60 transition">
            Dashboard
          </Link>
          <Link to="/admin/orders" className="text-sm font-bold hover:opacity-60 transition">
            Orders
          </Link>
          <Link to="/admin/analytics" className="text-sm font-bold hover:opacity-60 transition">
            Analytics
          </Link>
        </div>
      </div>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="analytics" element={<AdminAnalytics />} />
      </Routes>
    </>
  );
}
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
import { Routes, Route, Link } from "react-router-dom";
import AdminAnalytics from "./admin/AdminAnalytics";
import ConfirmModal from "../components/ConfirmModal";

/* ================= CLOUDINARY ================= */
const CLOUD_NAME = "dtvainaia";
const UPLOAD_PRESET = "gudrix_products";

/* ================= HELPERS ================= */
function formatDate(ts) {
  if (!ts) return "—";
  try {
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

async function uploadImage(file) {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: form }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Upload failed");
  return data.secure_url;
}

/* ================= IMAGE PREVIEW ================= */
function ImageModal({ src, onClose }) {
  if (!src) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
    >
      <img
        src={src}
        className="max-h-[90vh] max-w-[90vw] rounded-lg"
      />
    </div>
  );
}

/* ================= DASHBOARD ================= */
function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [preview, setPreview] = useState(null);

  // form
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState(1);
  const [category, setCategory] = useState("shoes");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // 🔥 universal modal state
  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "OK",
    danger: false,
    showCancel: false,
    onConfirm: null,
  });

  /* ---------- AUTH ---------- */
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) window.location.href = "/login";
      else setUser(u);
    });
  }, []);

  /* ---------- PRODUCTS ---------- */
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  /* ---------- SAVE PRODUCT ---------- */
  async function saveProduct() {
    if (!name || !price || !file) {
      setModal({
        open: true,
        title: "Missing fields",
        message: "Please fill all fields and select an image.",
        confirmText: "OK",
        danger: false,
        showCancel: false,
        onConfirm: closeModal,
      });
      return;
    }

    try {
      setSaving(true);
      const imageUrl = await uploadImage(file);

      await addDoc(collection(db, "products"), {
        name: name.trim(),
        price: Number(price),
        stock: Number(stock || 1),
        category,
        imageUrl,
        createdAt: serverTimestamp(),
        clientCreatedAt: Date.now(),
      });

      setName("");
      setPrice("");
      setStock(1);
      setFile(null);

      setModal({
        open: true,
        title: "Success",
        message: "✅ Product uploaded successfully.",
        confirmText: "OK",
        danger: false,
        showCancel: false,
        onConfirm: closeModal,
      });
    } catch (err) {
      setModal({
        open: true,
        title: "Upload failed",
        message: err.message,
        confirmText: "OK",
        danger: true,
        showCancel: false,
        onConfirm: closeModal,
      });
    } finally {
      setSaving(false);
    }
  }

  /* ---------- DELETE ---------- */
  function requestDelete(id) {
    setModal({
      open: true,
      title: "Delete Product",
      message:
        "This product will be permanently deleted. This action cannot be undone.",
      confirmText: "Delete",
      danger: true,
      showCancel: true,
      onConfirm: async () => {
        await deleteDoc(doc(db, "products", id));
        closeModal();
      },
    });
  }

  function closeModal() {
    setModal((m) => ({ ...m, open: false }));
  }

  if (!user) {
    return (
      <div className="p-10 text-center text-neutral-500">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <ImageModal src={preview} onClose={() => setPreview(null)} />

      {/* UNIVERSAL MODAL */}
      <ConfirmModal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        danger={modal.danger}
        showCancel={modal.showCancel}
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
      />

      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <button onClick={() => signOut(auth)} className="text-red-500">
          Logout
        </button>
      </div>

      {/* ADD PRODUCT */}
      <div className="border rounded-xl p-4 bg-white shadow space-y-4 mb-10">
        <h3 className="font-semibold">➕ Add Product</h3>

        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />

        <input
          type="number"
          placeholder="Stock"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />

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

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />

        {file && (
          <img
            src={URL.createObjectURL(file)}
            onClick={() => setPreview(URL.createObjectURL(file))}
            className="w-20 h-20 object-cover rounded border cursor-pointer"
          />
        )}

        <button
          disabled={saving}
          onClick={saveProduct}
          className="w-full bg-black text-white py-2 rounded-lg"
        >
          {saving ? "Uploading..." : "Save Product"}
        </button>
      </div>

      {/* PRODUCTS */}
      <div className="space-y-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 border rounded-lg p-2"
          >
            <img
              src={p.imageUrl}
              onClick={() => setPreview(p.imageUrl)}
              className="w-14 h-14 object-cover rounded cursor-pointer"
            />

            <div className="flex-1">
              <p className="text-sm font-medium">{p.name}</p>
              <p className="text-xs text-neutral-500 capitalize">
                ₦{p.price.toLocaleString()} • {p.category}
              </p>
              <p className="text-[11px] text-neutral-400">
                Uploaded: {formatDate(p.createdAt || p.clientCreatedAt)}
              </p>
            </div>

            <button
              onClick={() => requestDelete(p.id)}
              className="text-xs text-red-600"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= ROUTER ================= */
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

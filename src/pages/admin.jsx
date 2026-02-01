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
import AdminAnalytics from "./admin/AdminAnalytics";
import ConfirmModal from "../components/ConfirmModal";

/* ================= CLOUDINARY ================= */
const CLOUD_NAME = "dmo6gk6te"; // employer cloud name
const UPLOAD_PRESET = "gudrix_products"; // unsigned preset

/* ================= HELPERS ================= */
function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleString();
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

/* ================= IMAGE MODAL ================= */
function ImageModal({ src, onClose }) {
  if (!src) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
    >
      <img src={src} className="max-h-[90vh] rounded-lg" />
    </div>
  );
}

/* ================= DASHBOARD ================= */
function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [preview, setPreview] = useState(null);

  /* pagination */
  const PER_PAGE = 6;
  const [page, setPage] = useState(1);

  /* form / edit */
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("shoes");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  /* universal modal */
  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "OK",
    danger: false,
    showCancel: false,
    onConfirm: () => {},
  });

  const closeModal = () =>
    setModal((m) => ({ ...m, open: false }));

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

  /* ---------- PAGINATION ---------- */
  const totalPages = Math.ceil(products.length / PER_PAGE);

  const paginated = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return products.slice(start, start + PER_PAGE);
  }, [products, page]);

  /* ---------- SAVE / UPDATE ---------- */
  async function saveProduct() {
    if (!name || !price) {
      setModal({
        open: true,
        title: "Missing fields",
        message: "Name and price are required.",
        onConfirm: closeModal,
      });
      return;
    }

    try {
      setSaving(true);
      let imageUrl = editing?.imageUrl;

      if (file) imageUrl = await uploadImage(file);

      if (editing) {
        await updateDoc(doc(db, "products", editing.id), {
          name,
          price: Number(price),
          category,
          imageUrl,
        });
      } else {
        if (!file) throw new Error("Image required");
        await addDoc(collection(db, "products"), {
          name,
          price: Number(price),
          category,
          imageUrl,
          createdAt: serverTimestamp(),
        });
      }

      resetForm();
    } catch (err) {
      setModal({
        open: true,
        title: "Error",
        message: err.message,
        danger: true,
        onConfirm: closeModal,
      });
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setEditing(null);
    setName("");
    setPrice("");
    setCategory("shoes");
    setFile(null);
  }

  /* ---------- DELETE ---------- */
  function requestDelete(id) {
    setModal({
      open: true,
      title: "Delete Product",
      message: "This action cannot be undone.",
      confirmText: "Delete",
      danger: true,
      showCancel: true,
      onConfirm: async () => {
        await deleteDoc(doc(db, "products", id));
        closeModal();
      },
    });
  }

  function startEdit(p) {
    setEditing(p);
    setName(p.name);
    setPrice(p.price);
    setCategory(p.category);
    setFile(null);
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <ImageModal src={preview} onClose={() => setPreview(null)} />

      <ConfirmModal {...modal} onCancel={closeModal} />

      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <button onClick={() => signOut(auth)} className="text-red-500">
          Logout
        </button>
      </div>

      {/* ADD / EDIT */}
      <div className="border rounded-xl p-4 bg-white shadow mb-10 space-y-3">
        <h3 className="font-semibold">
          {editing ? "✏️ Edit Product" : "➕ Add Product"}
        </h3>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="border px-3 py-2 rounded w-full"
        />

        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price"
          type="number"
          className="border px-3 py-2 rounded w-full"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        >
          <option value="shoes">Shoes</option>
          <option value="heels">Heels</option>
          <option value="footwears">Footwears</option>
          <option value="jewelry">Jewelry</option>
          <option value="home-made-accessories">Home Made Accessories</option>
        </select>

        <input type="file" onChange={(e) => setFile(e.target.files[0])} />

        <div className="flex gap-2">
          <button
            onClick={saveProduct}
            disabled={saving}
            className="bg-black text-white px-4 py-2 rounded"
          >
            {saving ? "Saving..." : editing ? "Update" : "Save"}
          </button>

          {editing && (
            <button
              onClick={resetForm}
              className="border px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* PRODUCTS */}
      <div className="space-y-3">
        {paginated.map((p) => (
          <div key={p.id} className="border rounded p-2 flex gap-3">
            <img
              src={p.imageUrl}
              onClick={() => setPreview(p.imageUrl)}
              className="w-14 h-14 object-cover rounded cursor-pointer"
            />

            <div className="flex-1">
              <p className="font-medium">{p.name}</p>
              <p className="text-xs text-neutral-500">
                ₦{p.price} • {p.category}
              </p>
              <p className="text-[11px] text-neutral-400">
                {formatDate(p.createdAt)}
              </p>
            </div>

            <div className="flex flex-col text-xs gap-1">
              <button
                onClick={() => startEdit(p)}
                className="text-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => requestDelete(p.id)}
                className="text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center gap-3 mt-6">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Prev
        </button>

        <span className="text-sm">
          Page {page} / {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ================= ROUTER ================= */
export default function Admin() {
  return (
    <>
      <div className="border-b p-4 flex gap-4">
        <Link to="/admin" className="underline">Dashboard</Link>
        <Link to="/admin/analytics" className="underline">Analytics</Link>
      </div>

      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="analytics" element={<AdminAnalytics />} />
      </Routes>
    </>
  );
}

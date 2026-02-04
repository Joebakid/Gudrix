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
import Pagination from "../components/Pagination";

/* ================= CLOUDINARY ================= */
const CLOUD_NAME = "dmo6gk6te";
const UPLOAD_PRESET = "gudrix_products";

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
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
    >
      <img src={src} className="max-h-[90vh] max-w-full rounded-lg" />
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

  /* add form */
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("shoes");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  /* inline edit */
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [editFile, setEditFile] = useState(null);

  /* modal */
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
    const q = query(
      collection(db, "products"),
      orderBy("createdAt", "desc")
    );
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

  /* ---------- ADD PRODUCT ---------- */
  async function saveProduct() {
    if (!name || !price || !file) {
      setModal({
        open: true,
        title: "Missing fields",
        message: "All fields including image are required.",
        onConfirm: closeModal,
      });
      return;
    }

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
      setCategory("shoes");
      setFile(null);
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

  /* ---------- INLINE EDIT ---------- */
  function startEdit(p) {
    setEditingId(p.id);
    setEditData({
      name: p.name,
      price: p.price,
      category: p.category,
      imageUrl: p.imageUrl,
    });
    setEditFile(null);
  }

  async function saveEdit(id) {
    try {
      let imageUrl = editData.imageUrl;
      if (editFile) imageUrl = await uploadImage(editFile);

      await updateDoc(doc(db, "products", id), {
        ...editData,
        price: Number(editData.price),
        imageUrl,
      });

      setEditingId(null);
      setEditFile(null);
    } catch (err) {
      setModal({
        open: true,
        title: "Update failed",
        message: err.message,
        danger: true,
        onConfirm: closeModal,
      });
    }
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

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <ImageModal src={preview} onClose={() => setPreview(null)} />
      <ConfirmModal {...modal} onCancel={closeModal} />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <button onClick={() => signOut(auth)} className="text-red-500">
          Logout
        </button>
      </div>

      {/* ADD FORM */}
      <div className="border rounded-xl p-4 bg-white shadow mb-10 space-y-3">
        <h3 className="font-semibold">➕ Add Product</h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="border px-3 py-2 rounded"
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            type="number"
            className="border px-3 py-2 rounded"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        >
          <option value="shoes">Shoes</option>
          <option value="heels">Heels</option>
          <option value="footwears">Footwears</option>
          <option value="jewelry">Jewelry</option>
          <option value="home-made-accessories">
            Home Made Accessories
          </option>
        </select>

        <input type="file" onChange={(e) => setFile(e.target.files[0])} />

        <button
          onClick={saveProduct}
          disabled={saving}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* PRODUCTS */}
      <div className="space-y-3">
        {paginated.map((p) => {
          const editing = editingId === p.id;

          return (
            <div
              key={p.id}
              className="border rounded p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center"
            >
              <img
                src={editing ? editData.imageUrl : p.imageUrl}
                onClick={() => setPreview(p.imageUrl)}
                className="w-16 h-16 object-cover rounded cursor-pointer"
              />

              <div className="flex-1 w-full space-y-1">
                {editing ? (
                  <>
                    <input
                      value={editData.name}
                      onChange={(e) =>
                        setEditData({ ...editData, name: e.target.value })
                      }
                      className="border px-2 py-1 rounded w-full"
                    />
                    <input
                      type="number"
                      value={editData.price}
                      onChange={(e) =>
                        setEditData({ ...editData, price: e.target.value })
                      }
                      className="border px-2 py-1 rounded w-full"
                    />
                    <select
                      value={editData.category}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          category: e.target.value,
                        })
                      }
                      className="border px-2 py-1 rounded w-full"
                    >
                      <option value="shoes">Shoes</option>
                      <option value="heels">Heels</option>
                      <option value="footwears">Footwears</option>
                      <option value="jewelry">Jewelry</option>
                      <option value="home-made-accessories">
                        Home Made Accessories
                      </option>
                    </select>

                    <input
                      type="file"
                      onChange={(e) => setEditFile(e.target.files[0])}
                    />
                  </>
                ) : (
                  <>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-neutral-500">
                      ₦{p.price} • {p.category}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {formatDate(p.createdAt)}
                    </p>
                  </>
                )}
              </div>

              <div className="flex sm:flex-col gap-2 text-xs">
                {editing ? (
                  <>
                    <button
                      onClick={() => saveEdit(p.id)}
                      className="text-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-neutral-500"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* PAGINATION */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}

/* ================= ROUTER ================= */
export default function Admin() {
  return (
<>
  <div className="border-b bg-white sticky top-0 z-30">
    <div className="container-app mx-auto px-4 h-12 flex items-center gap-6">
      <Link
        to="/admin"
        className="text-sm font-medium text-neutral-700 hover:text-black transition"
      >
        Dashboard
      </Link>

      <Link
        to="/admin/analytics"
        className="text-sm font-medium text-neutral-700 hover:text-black transition"
      >
        Analytics
      </Link>
    </div>
  </div>

  <Routes>
    <Route index element={<AdminDashboard />} />
    <Route path="analytics" element={<AdminAnalytics />} />
  </Routes>
</>


  );
}

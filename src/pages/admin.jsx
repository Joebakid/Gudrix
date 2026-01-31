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

/* ================= CLOUDINARY CONFIG ================= */
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

/* ================= CLOUDINARY UPLOAD (DEBUG) ================= */
async function uploadImage(file) {
  console.log("📸 FILE OBJECT:", file);
  console.log("📄 TYPE:", file?.type);
  console.log("📏 SIZE (KB):", Math.round(file.size / 1024));
  console.log("☁️ CLOUD:", CLOUD_NAME);
  console.log("🎯 PRESET:", UPLOAD_PRESET);

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: form }
  );

  const data = await res.json();

  console.log("🔴 CLOUDINARY RESPONSE:", data);

  if (!res.ok) {
    throw new Error(data?.error?.message || "Upload failed");
  }

  console.log("✅ UPLOADED URL:", data.secure_url);
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
      <img
        src={src}
        className="max-h-[90vh] max-w-[90vw] rounded-lg"
      />
    </div>
  );
}

/* ================= ADMIN DASHBOARD ================= */
function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [preview, setPreview] = useState(null);

  // single-product form
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState(1);
  const [category, setCategory] = useState("shoes");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

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

  /* ---------- SAVE ONE PRODUCT ---------- */
  async function saveProduct() {
    if (!name || !price || !file) {
      alert("Fill all fields and select an image.");
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

      alert("✅ Product uploaded");
    } catch (err) {
      console.error("❌ FINAL ERROR:", err.message);
      alert(`❌ Upload failed: ${err.message}`);
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <ImageModal src={preview} onClose={() => setPreview(null)} />

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
              onClick={() => deleteProduct(p.id)}
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

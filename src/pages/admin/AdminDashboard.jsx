import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../../lib/firebase";

import ImageModal from "./components/ImageModal";
import CategoryBlock from "./components/CategoryBlock";
import ProductStats from "./components/ProductStats";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  // 🔐 Auth guard
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) window.location.href = "/login";
      else setUser(u);
    });
  }, []);

  // 📦 Products (Firestore = source of truth)
  useEffect(() => {
    const q = query(
      collection(db, "products"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setProducts(data);
    });
  }, []);

  // 🗂 Group products by category
  const groupedProducts = useMemo(() => {
    return products.reduce((acc, p) => {
      const cat = p.category || "others";
      acc[cat] = acc[cat] || [];
      acc[cat].push(p);
      return acc;
    }, {});
  }, [products]);

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
      {/* Image Preview */}
      <ImageModal
        src={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          Admin Dashboard
        </h2>
        <button
          onClick={() => signOut(auth)}
          className="text-sm text-red-500 hover:underline"
        >
          Logout
        </button>
      </div>

      {/* 🔢 PRODUCT STATS */}
      <div className="mb-10">
        <ProductStats products={products} />
      </div>

      {/* 📦 PRODUCTS BY CATEGORY */}
      <div className="space-y-10">
        {Object.entries(groupedProducts).map(
          ([cat, items]) => (
            <CategoryBlock
              key={cat}
              title={cat}
              items={items}
              onDelete={deleteProduct}
              onPreview={setPreviewImage}
            />
          )
        )}
      </div>
    </div>
  );
}

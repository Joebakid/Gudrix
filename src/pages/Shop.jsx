import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useCart } from "../context/CartContext";
import { logEvent } from "../lib/analytics";
import { useParams, useNavigate } from "react-router-dom";

export default function Shop({ page, setPage, pageSize = 8 }) {
  const { category } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState(category || "all");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [fullImage, setFullImage] = useState(null); // ✅ Image viewer

  const { addToCart } = useCart();

  // 🔥 Fetch products
  useEffect(() => {
    const q = query(
      collection(db, "products"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(items);
    });
  }, []);

  // ✅ Sync URL → filter
  useEffect(() => {
    if (category) {
      setFilter(category);
    } else {
      setFilter("all");
    }
  }, [category]);

  // 🔍 Filter + search + hide out-of-stock
  const filtered = products
    .filter((p) =>
      filter === "all" ? true : p.category === filter
    )
    .filter((p) => (p.stock ?? 0) > 0)
    .filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );

  // ✅ Reset page when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [filter, search, setPage]);

  // ⬆️ Auto scroll to top when page changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [page]);

  // ✅ Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;

  const paginatedProducts = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // 🪟 Open product modal
  function openProduct(product) {
    setSelectedProduct(product);

    logEvent("product_view", {
      productId: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
    });
  }

  // 🛒 Add to cart
  function handleAddToCart(product) {
    addToCart(product);

    logEvent("add_to_cart", {
      productId: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
    });
  }

  // 🔗 Change filter + URL together
  function changeFilter(next) {
    setFilter(next);

    if (next === "all") {
      navigate("/shop");
    } else {
      navigate(`/shop/${next}`);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Shop</h2>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <input
            placeholder="Search products..."
            className="border rounded-lg px-3 py-2 text-sm w-full sm:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {["all", "shoes", "slides", "heels", "jewelry"].map((f) => (
              <button
                key={f}
                onClick={() => changeFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm border transition
                  ${
                    filter === f
                      ? "bg-black text-white"
                      : "bg-white hover:bg-neutral-100"
                  }`}
              >
                {f === "all"
                  ? "All"
                  : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
        {paginatedProducts.map((p) => (
          <div
            key={p.id}
            onClick={() => openProduct(p)}
            className="border rounded-xl overflow-hidden hover:shadow-md transition bg-white flex flex-col cursor-pointer"
          >
            <img
              src={p.imageUrl}
              alt={p.name}
              className="w-full h-44 object-cover"
            />

            <div className="p-3 space-y-2 flex-1 flex flex-col">
              <h4 className="font-semibold text-sm">{p.name}</h4>

              <p className="text-sm font-medium">
                ₦{p.price.toLocaleString()}
              </p>

              <span className="text-xs text-neutral-500 capitalize">
                {p.category}
              </span>

              <span className="text-xs text-green-600 font-medium">
                In stock
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(p);
                }}
                className="mt-auto text-sm bg-black text-white py-1.5 rounded-lg hover:opacity-90"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <p className="text-center text-neutral-500 mt-10">
          No products found.
        </p>
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

      {/* 🪟 Product Modal */}
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
              className="absolute top-3 right-3 text-sm bg-black text-white py-0.5 px-1.5 rounded cursor-pointer"
            >
              CLOSE
            </button>

            {/* 👇 Click to view full image */}
            <img
              src={selectedProduct.imageUrl}
              onClick={() =>
                setFullImage(selectedProduct.imageUrl)
              }
              className="w-full object-cover rounded-lg mb-4 cursor-zoom-in"
            />

            <h3 className="font-bold text-lg">
              {selectedProduct.name}
            </h3>

            <p className="text-sm mb-1">
              ₦{selectedProduct.price.toLocaleString()}
            </p>

            <p className="text-xs text-neutral-500 mb-4">
              Stock: {selectedProduct.stock ?? 0}
            </p>

            <button
              onClick={() => {
                handleAddToCart(selectedProduct);
                setSelectedProduct(null);
              }}
              className="w-full bg-black text-white py-2 rounded-lg hover:opacity-90"
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}

      {/* 🖼️ FULL IMAGE VIEWER */}
      {fullImage && (
        <div
          onClick={() => setFullImage(null)}
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 cursor-zoom-out"
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

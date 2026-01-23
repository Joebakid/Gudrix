import { useEffect, useState, useMemo } from "react";
import {
  collection,
  onSnapshot,
  query,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useCart } from "../context/CartContext";
import { logEvent } from "../lib/analytics";
import { useParams, useNavigate } from "react-router-dom";

export default function Shop({ page, setPage, pageSize = 8 }) {
  const { category } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);       // initial load
  const [filterLoading, setFilterLoading] = useState(false); // category switch
  const [filter, setFilter] = useState(category || "all");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [fullImage, setFullImage] = useState(null);

  const { addToCart } = useCart();

  // 🔥 Fetch products (initial)
  useEffect(() => {
    setLoading(true);

    const q = query(collection(db, "products"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(items);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // ✅ Sync URL → filter
  useEffect(() => {
    if (category !== filter) {
      setFilterLoading(true);       // show spinner when switching category
      setFilter(category || "all");

      // small delay for smoother UX (feels intentional)
      const t = setTimeout(() => {
        setFilterLoading(false);
      }, 400);

      return () => clearTimeout(t);
    }
  }, [category]); // eslint-disable-line

  // 🔍 Filter + search + hide out-of-stock + SORT PRICE ASC
  const filtered = useMemo(() => {
    return products
      .filter((p) =>
        filter === "all" ? true : p.category === filter
      )
      .filter((p) => (p.stock ?? 0) > 0)
      .filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  }, [products, filter, search]);

  // ✅ Reset page when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [filter, search, setPage]);

  // ⬆️ Auto scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    navigate(next === "all" ? "/shop" : `/shop/${next}`);
  }

  const showLoader = loading || filterLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Shop</h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Search */}
          <input
            placeholder="Search products..."
            className="border rounded-lg px-3 py-2 text-sm w-full sm:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {["all", "shoes", "footwears", "heels", "jewelry"].map(
              (f) => (
                <button
                  key={f}
                  onClick={() => changeFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm border transition whitespace-nowrap
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
              )
            )}
          </div>
        </div>
      </div>

      {/* ✅ LOADER (initial + category change) */}
      {showLoader && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-black/20 border-t-black rounded-full animate-spin" />
          <p className="text-sm text-neutral-500">
            Loading products...
          </p>
        </div>
      )}

      {/* ✅ GRID */}
      {!showLoader && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {paginatedProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => openProduct(p)}
              className="border rounded-xl overflow-hidden hover:shadow-md transition bg-white flex flex-col cursor-pointer"
            >
              <img
                src={p.imageUrl}
                alt={p.name}
                className="w-full h-40 sm:h-44 object-cover"
              />

              <div className="p-3 space-y-2 flex-1 flex flex-col">
                <h4 className="font-semibold text-sm line-clamp-2">
                  {p.name}
                </h4>

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
      )}

      {/* Empty */}
      {!showLoader && filtered.length === 0 && (
        <p className="text-center text-neutral-500 mt-10">
          No products found.
        </p>
      )}

      {/* Pagination */}
      {!showLoader && totalPages > 1 && (
        <div className="flex flex-wrap justify-center items-center gap-3 mt-10 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>

          <span>
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
              className="absolute top-3 right-3 text-xs bg-black text-white py-1 px-2 rounded"
            >
              CLOSE
            </button>

            <img
              src={selectedProduct.imageUrl}
              onClick={() =>
                setFullImage(selectedProduct.imageUrl)
              }
              className="w-full max-h-[300px] object-cover rounded-lg mb-4 cursor-zoom-in"
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
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 cursor-zoom-out p-3"
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

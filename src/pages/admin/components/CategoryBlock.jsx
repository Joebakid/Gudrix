import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { formatDate } from "../utils/formatDate";

export default function CategoryBlock({
  title,
  items,
  onDelete,
  onPreview,
}) {
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
    if (!tempName.trim()) {
      alert("Name cannot be empty");
      return;
    }

    if (Number(tempPrice) < 0) {
      alert("Price must be valid");
      return;
    }

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
      console.error("Update failed:", err);
      alert("❌ Failed to update product");
    } finally {
      setSaving(false);
    }
  }

  if (!items.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg capitalize">
        {title.replace("-", " ")}
      </h3>

      {items.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-3 border rounded-lg p-2"
        >
          {/* IMAGE */}
          <img
            src={p.imageUrl}
            alt={p.name}
            onClick={() => onPreview(p.imageUrl)}
            className="w-14 h-14 object-cover rounded cursor-pointer"
          />

          {/* CONTENT */}
          <div className="flex-1">
            {editingId === p.id ? (
              <div className="space-y-2">
                <input
                  value={tempName}
                  onChange={(e) =>
                    setTempName(e.target.value)
                  }
                  className="w-full border rounded px-2 py-1 text-sm"
                />

                <input
                  type="number"
                  min="0"
                  value={tempPrice}
                  onChange={(e) =>
                    setTempPrice(e.target.value)
                  }
                  className="w-full border rounded px-2 py-1 text-sm"
                />

                <input
                  value={tempImageUrl}
                  onChange={(e) =>
                    setTempImageUrl(e.target.value)
                  }
                  className="w-full border rounded px-2 py-1 text-sm"
                />

                {tempImageUrl && (
                  <img
                    src={tempImageUrl}
                    onClick={() =>
                      onPreview(tempImageUrl)
                    }
                    onError={(e) =>
                      (e.currentTarget.style.display =
                        "none")
                    }
                    className="w-20 h-20 object-cover rounded border cursor-pointer"
                  />
                )}

                <select
                  value={tempCategory}
                  onChange={(e) =>
                    setTempCategory(e.target.value)
                  }
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="shoes">Shoes</option>
                  <option value="footwears">
                    Footwears
                  </option>
                  <option value="heels">Heels</option>
                  <option value="jewelry">Jewelry</option>
                  <option value="others">Others</option>
                </select>

                <button
                  disabled={saving}
                  onClick={() => saveEdit(p.id)}
                  className="text-xs bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium">
                  {p.name}
                </p>
                <p className="text-xs text-neutral-500 capitalize">
                  ₦{p.price.toLocaleString()} •{" "}
                  {p.category}
                </p>
                <p className="text-[11px] text-neutral-400">
                  Uploaded:{" "}
                  {formatDate(
                    p.createdAt || p.clientCreatedAt
                  )}
                </p>
              </>
            )}
          </div>

          {/* ACTIONS */}
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

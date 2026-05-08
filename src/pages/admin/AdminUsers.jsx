import { useEffect, useState } from "react";
import {
  collection, onSnapshot,
  doc, updateDoc, getDocs, where, query,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import ConfirmModal from "../../components/ConfirmModal";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [orderCounts, setOrderCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState({ open: false, title: "", message: "", onConfirm: () => {} });

  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  /* ── Fetch users ── */
  useEffect(() => {
    // ✅ No orderBy — avoids excluding docs without createdAt
    const unsub = onSnapshot(collection(db, "users"), async (snap) => {
      const userList = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        // ✅ Sort in JS so missing createdAt docs still appear
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds ?? 0;
          const bTime = b.createdAt?.seconds ?? 0;
          return bTime - aTime;
        });

      setUsers(userList);
      setLoading(false);

      // Fetch order counts
      const counts = {};
      await Promise.all(
        userList.map(async (u) => {
          const ordersSnap = await getDocs(
            query(collection(db, "orders"), where("userId", "==", u.uid || u.id))
          );
          counts[u.id] = ordersSnap.size;
        })
      );
      setOrderCounts(counts);
    });
    return () => unsub();
  }, []);

  /* ── Toggle admin ── */
  function toggleAdmin(user) {
    const action = user.isAdmin ? "remove admin from" : "make admin";
    setModal({
      open: true,
      title: user.isAdmin ? "Remove Admin" : "Make Admin",
      message: `Are you sure you want to ${action} ${user.fullName || user.email}?`,
      onConfirm: async () => {
        await updateDoc(doc(db, "users", user.id), { isAdmin: !user.isAdmin });
        closeModal();
      },
    });
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.fullName?.toLowerCase().includes(q)
    );
  });

  function formatDate(ts) {
    if (!ts) return "—";
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleDateString();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <ConfirmModal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        confirmText="Confirm"
        showCancel
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Users</h2>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} registered users</p>
        </div>
        <input
          placeholder="Search by name or email..."
          className="border rounded-xl px-3 py-2 text-sm outline-none focus:border-black w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-black/20 border-t-black rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-20">No users found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="border rounded-2xl p-4 bg-white flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-bold shrink-0 uppercase">
                {(u.fullName || u.email || "?")[0]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium truncate">{u.fullName || "—"}</p>
                  {u.isAdmin && (
                    <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{u.email}</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-xs text-gray-400">
                    Joined {formatDate(u.createdAt)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {orderCounts[u.id] ?? 0} order{orderCounts[u.id] !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <button
                onClick={() => toggleAdmin(u)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition shrink-0 ${
                  u.isAdmin
                    ? "border-red-200 text-red-500 hover:bg-red-50"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {u.isAdmin ? "Remove Admin" : "Make Admin"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
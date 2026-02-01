import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

import ProductStats from "./components/ProductStats";

/* ---------------- Utils ---------------- */
function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

export default function AdminAnalytics() {
  const [events, setEvents] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  /* -------- Analytics events -------- */
  useEffect(() => {
    const [year, month] = selectedMonth.split("-").map(Number);

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const q = query(
      collection(db, "analytics"),
      where("createdAt", ">=", Timestamp.fromDate(start)),
      where("createdAt", "<", Timestamp.fromDate(end)),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      setEvents(
        snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });
  }, [selectedMonth]);

  /* -------- Products inventory -------- */
  useEffect(() => {
    const q = query(collection(db, "products"));
    return onSnapshot(q, snap => {
      setProducts(
        snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });
  }, []);

  /* -------- KPIs -------- */
  const stats = useMemo(() => {
    const pageViews = events.filter(e => e.type === "page_view").length;
    const productViews = events.filter(e => e.type === "product_view").length;
    const addToCart = events.filter(e => e.type === "add_to_cart").length;
    const checkouts = events.filter(e => e.type === "checkout_click").length;

    const uniqueVisitors = new Set(
      events.map(e => e.visitorId).filter(Boolean)
    ).size;

    return {
      pageViews,
      productViews,
      addToCart,
      checkouts,
      uniqueVisitors,
    };
  }, [events]);

  return (
    <div className="container-app py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Gudrix Analytics Dashboard
        </h1>

        <input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
      </div>

      {/* Traffic KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="Visitors" value={stats.uniqueVisitors} />
        <Stat label="Page Views" value={stats.pageViews} />
        <Stat label="Product Views" value={stats.productViews} />
        <Stat label="Add To Cart" value={stats.addToCart} />
        <Stat label="Checkouts" value={stats.checkouts} />
      </div>

      {/* Inventory Stats */}
      <div>
        <h2 className="font-semibold mb-3">
          Product Inventory
        </h2>
        <ProductStats products={products} />
      </div>
    </div>
  );
}

/* ---------------- UI ---------------- */
function Stat({ label, value }) {
  return (
    <div className="bg-black text-white rounded-xl p-4">
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

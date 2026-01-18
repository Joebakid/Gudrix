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

export default function AdminAnalytics() {
  const [events, setEvents] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  // -----------------------------------
  // 🔥 Load analytics by selected month
  // -----------------------------------
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

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(data);
    });

    return () => unsub();
  }, [selectedMonth]);

  // -----------------------------------
  // 📊 Calculate stats + aggregations
  // -----------------------------------
  const stats = useMemo(() => {
    const pageEvents = events.filter(
      (e) => e.type === "page_view"
    );
    const productViews = events.filter(
      (e) => e.type === "product_view"
    );
    const addToCart = events.filter(
      (e) => e.type === "add_to_cart"
    );
    const checkouts = events.filter(
      (e) => e.type === "checkout_click"
    );

    // ------------------------
    // Visitors (unique people)
    // ------------------------
    const uniqueVisitors =
      new Set(
        events.map((e) => e.visitorId).filter(Boolean)
      ).size || 0;

    // ------------------------
    // Page Aggregation
    // ------------------------
    const pageMap = {};
    const pageVisitors = {};

    pageEvents.forEach((e) => {
      const path = e.payload?.path || "unknown";
      const visitor = e.visitorId;

      pageMap[path] = (pageMap[path] || 0) + 1;

      if (!pageVisitors[path]) {
        pageVisitors[path] = new Set();
      }
      if (visitor) {
        pageVisitors[path].add(visitor);
      }
    });

    const mostVisitedPage = Object.entries(pageMap).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const totalPageVisitors =
      Object.values(pageVisitors).reduce(
        (sum, set) => sum + set.size,
        0
      ) || 1;

    const visitorsPerPage = Object.entries(pageVisitors).map(
      ([path, visitors]) => ({
        path,
        percent: Math.round(
          (visitors.size / totalPageVisitors) * 100
        ),
      })
    );

    // ------------------------
    // Product Aggregation
    // ------------------------
    function aggregateProducts(list) {
      const map = {};

      list.forEach((e) => {
        const p = e.payload;
        if (!p?.productId) return;

        map[p.productId] = map[p.productId] || {
          id: p.productId,
          name: p.name,
          count: 0,
        };

        map[p.productId].count++;
      });

      return Object.values(map).sort(
        (a, b) => b.count - a.count
      );
    }

    const mostViewedProducts =
      aggregateProducts(productViews);
    const mostAddedProducts =
      aggregateProducts(addToCart);
    const mostCheckoutProducts =
      aggregateProducts(checkouts);

    // ------------------------
    // Device Detection
    // ------------------------
    function detectDevice(userAgent = "") {
      const ua = userAgent.toLowerCase();

      if (
        ua.includes("android") ||
        ua.includes("iphone") ||
        ua.includes("ipad") ||
        ua.includes("mobile")
      ) {
        return "Mobile";
      }

      return "Desktop";
    }

    const deviceMap = {};

    events.forEach((e) => {
      const device = detectDevice(e.userAgent);
      deviceMap[device] = (deviceMap[device] || 0) + 1;
    });

    const totalDevices =
      Object.values(deviceMap).reduce(
        (a, b) => a + b,
        0
      ) || 1;

    const devices = Object.entries(deviceMap).map(
      ([name, count]) => ({
        name,
        percent: Math.round(
          (count / totalDevices) * 100
        ),
      })
    );

    const revenue = checkouts.reduce(
      (sum, e) =>
        sum + (Number(e.payload?.cartTotal) || 0),
      0
    );

    return {
      pageViews: pageEvents.length,
      productViews: productViews.length,
      addToCart: addToCart.length,
      checkouts: checkouts.length,
      revenue,
      uniqueVisitors,
      mostVisitedPage,
      visitorsPerPage,
      mostViewedProducts,
      mostAddedProducts,
      mostCheckoutProducts,
      devices,
    };
  }, [events]);

  return (
    <div className="container-app py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">
          Gudrix Analytics Dashboard
        </h1>

        {/* 📅 Month Selector */}
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) =>
            setSelectedMonth(e.target.value)
          }
          className="border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* ===== KPI CARDS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Stat label="Visitors" value={stats.uniqueVisitors} />
        <Stat label="Page Views" value={stats.pageViews} />
        <Stat
          label="Product Views"
          value={stats.productViews}
        />
        <Stat label="Add To Cart" value={stats.addToCart} />
        <Stat label="Checkouts" value={stats.checkouts} />
        <Stat
          label="Est. Revenue"
          value={`₦${stats.revenue.toLocaleString()}`}
        />
      </div>

      {/* ===== INSIGHTS GRID ===== */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Insight title="Most Visited Page">
          {stats.mostVisitedPage ? (
            <>
              <p className="font-medium">
                {stats.mostVisitedPage[0]}
              </p>
              <p className="text-sm opacity-70">
                {stats.mostVisitedPage[1]} views
              </p>
            </>
          ) : (
            <Empty />
          )}
        </Insight>

        <Insight title="Most Viewed Product">
          {stats.mostViewedProducts[0] ? (
            <>
              <p className="font-medium">
                {stats.mostViewedProducts[0].name}
              </p>
              <p className="text-sm opacity-70">
                {stats.mostViewedProducts[0].count} views
              </p>
            </>
          ) : (
            <Empty />
          )}
        </Insight>

        <Insight title="Most Added To Cart">
          {stats.mostAddedProducts[0] ? (
            <>
              <p className="font-medium">
                {stats.mostAddedProducts[0].name}
              </p>
              <p className="text-sm opacity-70">
                {stats.mostAddedProducts[0].count} adds
              </p>
            </>
          ) : (
            <Empty />
          )}
        </Insight>

        <Insight title="Most Checkout Product">
          {stats.mostCheckoutProducts[0] ? (
            <>
              <p className="font-medium">
                {stats.mostCheckoutProducts[0].name}
              </p>
              <p className="text-sm opacity-70">
                {stats.mostCheckoutProducts[0].count} checkouts
              </p>
            </>
          ) : (
            <Empty />
          )}
        </Insight>

        <Insight title="Visitors Per Page">
          {stats.visitorsPerPage.length ? (
            <div className="space-y-1 text-sm">
              {stats.visitorsPerPage.map((p) => (
                <div
                  key={p.path}
                  className="flex justify-between"
                >
                  <span>{p.path}</span>
                  <span>{p.percent}%</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Insight>

        <Insight title="Devices">
          {stats.devices.length ? (
            <div className="space-y-1 text-sm">
              {stats.devices.map((d) => (
                <div
                  key={d.name}
                  className="flex justify-between"
                >
                  <span>{d.name}</span>
                  <span>{d.percent}%</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Insight>
      </div>
    </div>
  );
}

/* ------------------------------
   Small UI Components
------------------------------- */

function Stat({ label, value }) {
  return (
    <div className="bg-black text-white rounded-xl p-4">
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Insight({ title, children }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <h3 className="font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <p className="text-sm text-neutral-500">
      No data yet.
    </p>
  );
}

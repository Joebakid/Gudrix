import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminAnalytics() {
  const [events, setEvents] = useState([]);

  // 🔥 Load analytics events live
  useEffect(() => {
    const q = query(
      collection(db, "analytics"),
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
  }, []);

  // 📊 Calculate stats + aggregations
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
    const uniqueVisitors = new Set(
      events.map((e) => e.visitorId).filter(Boolean)
    ).size;

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

    const visitorsPerPage = Object.entries(pageVisitors).map(
      ([path, visitors]) => ({
        path,
        visitors: visitors.size,
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

      if (ua.includes("android")) return "Android";
      if (ua.includes("iphone") || ua.includes("ipad"))
        return "iOS";
      if (ua.includes("windows")) return "Windows";
      if (ua.includes("mac")) return "Mac";
      if (ua.includes("linux")) return "Linux";

      return "Unknown";
    }

    const deviceMap = {};

    events.forEach((e) => {
      const device = detectDevice(e.userAgent);
      deviceMap[device] = (deviceMap[device] || 0) + 1;
    });

    const devices = Object.entries(deviceMap).map(
      ([name, count]) => ({
        name,
        count,
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
    <div className="container-app">

   
    <div className="  px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Gudrix Analytics Dashboard
      </h1>

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
        {/* Most Visited Page */}
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

        {/* Most Viewed Product */}
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

        {/* Most Added To Cart */}
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

        {/* Most Checkout Product */}
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

        {/* Visitors Per Page */}
        <Insight title="Visitors Per Page">
          {stats.visitorsPerPage.length ? (
            <div className="space-y-1 text-sm">
              {stats.visitorsPerPage.map((p) => (
                <div
                  key={p.path}
                  className="flex justify-between"
                >
                  <span>{p.path}</span>
                  <span>{p.visitors}</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Insight>

        {/* Devices */}
        <Insight title="Devices">
          {stats.devices.length ? (
            <div className="space-y-1 text-sm">
              {stats.devices.map((d) => (
                <div
                  key={d.name}
                  className="flex justify-between"
                >
                  <span>{d.name}</span>
                  <span>{d.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Insight>
      </div>

      {/* ===== RECENT EVENTS ===== */}
      <div className="bg-white rounded-xl p-4 shadow">
        <h2 className="font-semibold mb-3">
          Recent Activity
        </h2>

        <div className="space-y-2 max-h-[420px] overflow-auto text-sm">
          {events.slice(0, 50).map((e) => (
            <div
              key={e.id}
              className="border-b pb-2 flex justify-between gap-4"
            >
              <div>
                <div className="font-medium">
                  {e.type}
                </div>
                <div className="opacity-60 break-all">
                  {JSON.stringify(e.payload)}
                </div>
              </div>

              <div className="opacity-50 text-xs whitespace-nowrap">
                {e.createdAt?.seconds
                  ? new Date(
                      e.createdAt.seconds * 1000
                    ).toLocaleString()
                  : "now"}
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <p className="text-center text-neutral-500 py-10">
              No analytics data yet.
            </p>
          )}
        </div>
      </div>
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

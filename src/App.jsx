import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Admin from "./pages/admin";
import AdminLogin from "./pages/AdminLogin";
import Shop from "./pages/Shop";
import { Analytics } from "@vercel/analytics/react";

// ✅ Gudrix custom analytics logger
import { logEvent } from "./lib/analytics";

/* --------------------------------------------
   Page Tracker Component
--------------------------------------------- */
function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    logEvent("page_view", {
      path: location.pathname,
    });
  }, [location.pathname]);

  return null;
}

export default function App() {
  // ✅ SHOP PAGINATION STATE (GLOBAL)
  const [shopPage, setShopPage] = useState(1);

  return (
    <BrowserRouter>
      {/* ✅ Gudrix Analytics */}
      <PageTracker />

      <Navbar />

      <Routes>
        {/* Redirect root to shop */}
        <Route path="/" element={<Navigate to="/shop" replace />} />

        {/* 🛒 Shop (pagination controlled here) */}
        <Route
          path="/shop"
          element={
            <Shop
              page={shopPage}
              setPage={setShopPage}
              pageSize={8} // change to 8, 16 etc if you want
            />
          }
        />

        <Route path="/login" element={<AdminLogin />} />

        {/* ✅ Admin routes untouched */}
        <Route path="/admin/*" element={<Admin />} />
      </Routes>

      {/* ✅ Vercel Analytics */}
      <Analytics />
    </BrowserRouter>
  );
}

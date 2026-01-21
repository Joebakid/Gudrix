// import "./scripts/migrateSlides";

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
import NotFound from "./pages/NotFound";
import Footer from "./pages/Footer";

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
      <div className="min-h-screen flex flex-col">
        {/* ✅ Gudrix Analytics */}
        <PageTracker />

        <Navbar />

        {/* ✅ Main content expands to push footer */}
        <main className="flex-1">
          <Routes>
            {/* Redirect root to shop */}
            <Route path="/" element={<Navigate to="/shop" replace />} />

            {/* 🛒 Shop */}
            <Route
              path="/shop"
              element={
                <Shop
                  page={shopPage}
                  setPage={setShopPage}
                  pageSize={8}
                />
              }
            />

            <Route
              path="/shop/:category"
              element={
                <Shop
                  page={shopPage}
                  setPage={setShopPage}
                  pageSize={8}
                />
              }
            />

            <Route path="/login" element={<AdminLogin />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {/* ✅ Sticky Footer */}
        <Footer />

        {/* ✅ Vercel Analytics */}
        <Analytics />
      </div>
    </BrowserRouter>
  );
}

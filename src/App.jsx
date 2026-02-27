import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./pages/Footer"; 
import ScrollToTop from "./components/ScrollToTop"; 

import Admin from "./pages/admin";
import AdminLogin from "./pages/AdminLogin";
import Shop from "./pages/Shop";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

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
      {/* ✅ Auto Scroll To Top on Route Change */}
      <ScrollToTop />

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
                  pageSize={16}
                />
              }
            />

            <Route
              path="/shop/:category"
              element={
                <Shop
                  page={shopPage}
                  setPage={setShopPage}
                  pageSize={16}
                />
              }
            />

            {/* 📄 Legal Pages */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* 🔐 Admin */}
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/admin/*" element={<Admin />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {/* ✅ Footer */}
        <Footer />

        {/* ✅ Vercel Analytics */}
        <Analytics />
      </div>
    </BrowserRouter>
  );
}
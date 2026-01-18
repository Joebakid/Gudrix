import { useEffect } from "react";
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
   Tracks every route change for Gudrix analytics
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
  return (
    <BrowserRouter>
      {/* ✅ Gudrix Analytics */}
      <PageTracker />

      <Navbar />

      <Routes>
        {/* Redirect root to shop */}
        <Route path="/" element={<Navigate to="/shop" replace />} />

        <Route path="/shop" element={<Shop />} />
        <Route path="/login" element={<AdminLogin />} />

        {/* ✅ IMPORTANT FIX: allow nested admin routes */}
        <Route path="/admin/*" element={<Admin />} />
      </Routes>

      {/* ✅ Vercel Analytics (keep for comparison) */}
      <Analytics />
    </BrowserRouter>
  );
}

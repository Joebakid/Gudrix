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
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

import { Analytics } from "@vercel/analytics/react";
import { logEvent } from "./lib/analytics";
import { useAuth } from "./context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./lib/firebase";

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    logEvent("page_view", { path: location.pathname });
  }, [location.pathname]);
  return null;
}

function ProtectedAdminRoute() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      setIsAdmin(snap.exists() && snap.data().isAdmin === true);
    });
  }, [user]);

  if (loading || isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-black/20 border-t-black rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/shop" replace />;

  return <Admin />;
}

function ProtectedUserRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-black/20 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [shopPage, setShopPage] = useState(1);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col">
        <PageTracker />
        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/shop" replace />} />

            {/* 🛒 Shop Routes */}
            <Route
              path="/shop"
              element={<Shop page={shopPage} setPage={setShopPage} pageSize={16} />}
            />
            <Route
              path="/shop/:category"
              element={<Shop page={shopPage} setPage={setShopPage} pageSize={16} />}
            />

            {/* 👤 User Account Route — protected */}
            <Route
              path="/account"
              element={
                <ProtectedUserRoute>
                  <Account />
                </ProtectedUserRoute>
              }
            />

            {/* 📄 Legal Pages */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* 🔐 Auth & Admin */}
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/admin/*" element={<ProtectedAdminRoute />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
        <Analytics />
      </div>
    </BrowserRouter>
  );
}
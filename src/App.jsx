import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Admin from "./pages/admin";
import AdminLogin from "./pages/AdminLogin";
import Shop from "./pages/Shop";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* Redirect root to shop */}
        <Route path="/" element={<Navigate to="/shop" replace />} />

        <Route path="/shop" element={<Shop />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

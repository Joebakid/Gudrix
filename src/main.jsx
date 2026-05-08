import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "../globals.css"; // Correct path to root CSS
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider> {/* Providers must wrap the App */}
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);
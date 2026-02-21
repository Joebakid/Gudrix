import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { FiShoppingCart } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import CartDrawer from "./CartDrawer";

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition
   ${isActive ? "bg-black text-white" : "hover:bg-neutral-100"}`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <>
      <nav className="w-full border-b bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/shop" className="font-bold text-lg tracking-wide">
            Gudrix
          </Link>

          <div className="flex gap-2 items-center">
            <NavLink to="/shop" className={linkClass}>
              Shop
            </NavLink>

            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>

            <button
              onClick={() => setOpen(true)}
              className="relative ml-1 p-2 rounded-lg hover:bg-neutral-100"
            >
              <FiShoppingCart className="text-xl" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full px-1 min-w-[18px] text-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <CartDrawer open={open} setOpen={setOpen} />
    </>
  );
}
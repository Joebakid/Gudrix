import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-5xl font-bold mb-3">404</h1>

      <p className="text-lg text-neutral-600 mb-6">
        Oops 😕 This page is not available.
      </p>

      <Link
        to="/shop"
        className="bg-black text-white px-6 py-3 rounded-lg hover:opacity-90"
      >
        Go back to Shop
      </Link>
    </div>
  );
}

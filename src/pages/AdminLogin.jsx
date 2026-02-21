import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/admin");
    } catch (err) {
      setError("Invalid email or password");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-neutral-50 px-4">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-neutral-200 p-8">

        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Gudrix Admin
          </h2>
          <p className="text-sm text-neutral-500 mt-2">
            Sign in to manage products
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">

          {/* Email */}
          <div>
            <label className="text-sm text-neutral-600 block mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="admin@gudrix.com.ng"
              className="w-full border border-neutral-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-neutral-600 block mb-1">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                className="w-full border border-neutral-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-black transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black transition"
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Button */}
          <button
            disabled={loading}
            className="w-full bg-black text-white rounded-xl py-3 font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? "Signing in..." : "Login"}
          </button>

        </form>

      </div>

    </div>
  );
}
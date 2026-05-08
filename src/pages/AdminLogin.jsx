import { useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";

const FIREBASE_ERRORS = {
  "auth/invalid-credential": "Incorrect email or password. Please try again.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/too-many-requests": "Too many failed attempts. Please try again later.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/user-disabled": "This account has been disabled. Contact support.",
};

function getErrorMessage(err) {
  const code = err?.code || "";
  return FIREBASE_ERRORS[code] || "Something went wrong. Please try again.";
}

export default function AdminLogin() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", fullName: "" });
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [modal, setModal] = useState({ open: false, title: "", message: "" });
  const navigate = useNavigate();

  const showError = (title, message) => setModal({ open: true, title, message });
  const closeModal = () => setModal({ open: false, title: "", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const emailInput = formData.email.trim().toLowerCase();

    try {
      let userCredential;

      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(auth, emailInput, formData.password);
        await updateProfile(userCredential.user, { displayName: formData.fullName });
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          fullName: formData.fullName,
          email: emailInput,
          isAdmin: false,
          createdAt: serverTimestamp(),
        });
        await sendEmailVerification(userCredential.user);
        setVerificationSent(true);
        setLoading(false);
        return;
      } else {
        userCredential = await signInWithEmailAndPassword(auth, emailInput, formData.password);

        if (!userCredential.user.emailVerified) {
          await auth.signOut();
          showError(
            "Email Not Verified",
            "Please verify your email before logging in. Check your inbox for the verification link."
          );
          setLoading(false);
          return;
        }
      }

      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;

      if (userData?.isAdmin === true) {
        navigate("/admin");
      } else {
        navigate("/account");
      }

    } catch (err) {
      console.error("Auth Error:", err);
      showError("Login Failed", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setLoading(true);
    try {
      const emailInput = formData.email.trim().toLowerCase();
      const userCredential = await signInWithEmailAndPassword(auth, emailInput, formData.password);
      await sendEmailVerification(userCredential.user);
      await auth.signOut();
      setVerificationSent(true);
    } catch (err) {
      showError("Failed to Resend", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Verification sent screen ──
  if (verificationSent) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-sm border text-center">
        <div className="text-4xl mb-4">📧</div>
        <h2 className="text-2xl font-bold mb-2">Check your email</h2>
        <p className="text-gray-500 mb-6">
          We sent a verification link to{" "}
          <span className="font-medium text-black">{formData.email}</span>.
          Click the link to activate your account, then come back to log in.
        </p>
        <button
          onClick={() => { setVerificationSent(false); setIsRegister(false); }}
          className="w-full bg-black text-white py-3 rounded-xl font-bold hover:opacity-90 transition"
        >
          Go to Login
        </button>
        <button
          onClick={resendVerification}
          disabled={loading}
          className="w-full mt-3 text-sm text-gray-500 hover:text-black transition disabled:opacity-40"
        >
          {loading ? "Sending..." : "Resend verification email"}
        </button>
      </div>
    );
  }

  return (
    <>
      <ConfirmModal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        confirmText="OK"
        onConfirm={closeModal}
        onCancel={closeModal}
      />

      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-sm border">
        <h2 className="text-2xl font-bold mb-6">
          {isRegister ? "Create Account" : "Welcome Back"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input
              className="w-full p-3 border rounded-xl outline-none focus:border-black"
              placeholder="Full Name"
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          )}
          <input
            className="w-full p-3 border rounded-xl outline-none focus:border-black"
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            className="w-full p-3 border rounded-xl outline-none focus:border-black"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <button
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl font-bold transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Processing..." : isRegister ? "Sign Up" : "Login"}
          </button>
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="w-full mt-4 text-sm text-gray-500 hover:text-black transition"
        >
          {isRegister ? "Already have an account? Login" : "New to Gudrix? Create account"}
        </button>
      </div>
    </>
  );
}
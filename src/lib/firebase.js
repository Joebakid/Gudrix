import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDJVzQJ9WjpEGwe4npTPhl_qf9Cxc3PM90",
  authDomain: "gudrix-5d944.firebaseapp.com",
  projectId: "gudrix-5d944",
  storageBucket: "gudrix-5d944.firebasestorage.app",
  messagingSenderId: "312659300482",
  appId: "1:312659300482:web:3cfb66243c2a3ee3eea49b",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ THESE EXPORTS MUST EXIST
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

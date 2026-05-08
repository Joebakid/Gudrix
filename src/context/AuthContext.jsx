import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [starred, setStarred] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);
          setStarred(data.starred || []);
        }
      } else {
        setUserData(null);
        setStarred([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleStar = async (productId) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const isStarred = starred.includes(productId);
    if (isStarred) {
      await updateDoc(userRef, { starred: arrayRemove(productId) });
      setStarred((prev) => prev.filter((id) => id !== productId));
    } else {
      await updateDoc(userRef, { starred: arrayUnion(productId) });
      setStarred((prev) => [...prev, productId]);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, starred, toggleStar, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
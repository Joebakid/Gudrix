import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

/* -----------------------------------
   Visitor ID (unique per browser)
------------------------------------ */
function getVisitorId() {
  let id = localStorage.getItem("visitor_id");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("visitor_id", id);
  }

  return id;
}

/* -----------------------------------
   Main Analytics Logger
------------------------------------ */
export async function logEvent(type, payload = {}) {
  try {
    await addDoc(collection(db, "analytics"), {
      type,                            // "page_view", "product_view", etc
      payload,
      visitorId: getVisitorId(),       // 👤 unique visitor
      createdAt: serverTimestamp(),
      userAgent: navigator.userAgent, // 📱 device detection
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      referrer: document.referrer || null,
      url: window.location.href,
    });
  } catch (err) {
    console.error("Analytics error:", err);
  }
}

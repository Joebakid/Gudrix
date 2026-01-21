import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";

async function migrateSlides() {
  const snap = await getDocs(collection(db, "products"));

  let count = 0;

  for (const d of snap.docs) {
    const data = d.data();

    if (data.category === "slides" || data.category === "footwear") {
      await updateDoc(doc(db, "products", d.id), {
        category: "footwears",
      });
      count++;
    }
  }

  console.log(`✅ Updated ${count} products to footwears`);
}

migrateSlides();

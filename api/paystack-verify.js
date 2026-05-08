import { Resend } from "resend";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false });
  }

  const {
    reference,
    cart,
    total,
    subtotal,
    waybill,
    customer,
    userId, // New: Captured from the frontend
  } = req.body;

  try {
    /* ================= VERIFY PAYSTACK ================= */
    const verify = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await verify.json();

    if (!data.status || data.data.status !== "success") {
      return res.status(400).json({ success: false });
    }

    /* ================= PREVENT DUPLICATE ORDER ================= */
    const existing = await db
      .collection("orders")
      .where("reference", "==", reference)
      .get();

    if (!existing.empty) {
      return res.status(200).json({ success: true });
    }

    /* ================= SAVE ORDER TO FIRESTORE ================= */
    // We add the userId so this order "belongs" to a user profile
    await db.collection("orders").add({
      reference,
      cart,
      total,
      subtotal,
      waybill,
      customer,
      userId: userId || "guest", 
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    /* ================= SEND EMAIL ================= */
    // (Existing email logic stays the same...)
    await resend.emails.send({
      from: "Gudrix <orders@gudrix.com.ng>",
      to: "01gudrix@gmail.com",
      subject: "New Order Received 🛒",
      html: `<h2>New Order from ${customer.fullName}</h2><p>Ref: ${reference}</p>`,
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("PAYSTACK VERIFY ERROR:", err);
    return res.status(500).json({ success: false });
  }
}
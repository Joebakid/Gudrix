const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();
const db = admin.firestore();

exports.paystackVerify = onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false });
    }

    const { reference, cart, subtotal, waybill, total, customer } = req.body;

    if (!reference) {
      return res.status(400).json({ success: false });
    }

    const secretKey = process.env.PAYSTACK_SECRET ||
      require("firebase-functions").config().paystack.secret;

    // Verify with Paystack
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const verifyData = await verifyRes.json();

    if (
      !verifyData.data ||
      verifyData.data.status !== "success"
    ) {
      return res.status(400).json({ success: false });
    }

    // 🔒 SECURITY CHECK — Confirm Amount Matches
    const paidAmount = verifyData.data.amount / 100; // convert from kobo

    if (paidAmount !== total) {
      logger.error("Amount mismatch", {
        paidAmount,
        expected: total,
      });
      return res.status(400).json({ success: false });
    }

    // 🔒 Prevent duplicate reference
    const existing = await db
      .collection("orders")
      .where("reference", "==", reference)
      .get();

    if (!existing.empty) {
      return res.json({ success: true });
    }

    // Save order
    await db.collection("orders").add({
      reference,
      cart,
      subtotal,
      waybill,
      total,
      customer,
      status: "paid",
      paymentMethod: "paystack",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ success: true });

  } catch (error) {
    logger.error("Verification error", error);
    return res.status(500).json({ success: false });
  }
});
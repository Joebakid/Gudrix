export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        error: "Secret key not configured",
      });
    }

    const { reference } = req.body;

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

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return res.status(500).json({ success: false });
  }
}
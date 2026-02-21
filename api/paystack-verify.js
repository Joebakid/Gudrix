import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ success: false });

  const {
    reference,
    cart,
    total,
    subtotal,
    waybill,
    customer,
  } = req.body;

  try {
    // Verify with Paystack
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

    // 📨 Send Email to Owner
  await resend.emails.send({
  from: "Gudrix <orders@gudrix.com.ng>",
  to: "01gudrix@gmail.com",
  subject: "New Order Received 🛒",
  html: `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;">
      <h2 style="margin-bottom:5px;">🛒 New Order</h2>
      <p><strong>Name:</strong> ${customer.fullName}</p>
      <p><strong>Email:</strong> ${customer.email}</p>
      <p><strong>Phone:</strong> ${customer.phone}</p>
      <p><strong>Total:</strong> ₦${Number(total).toLocaleString()}</p>
      <hr style="margin:20px 0;" />

      <h3>Items Ordered:</h3>

      ${cart
        .map(
          (item) => `
            <div style="display:flex; gap:15px; margin-bottom:15px; align-items:center;">
              <img 
                src="${item.imageUrl}" 
                alt="${item.name}" 
                width="80" 
                height="80" 
                style="object-fit:cover; border-radius:8px;"
              />
              <div>
                <p style="margin:0;"><strong>${item.name}</strong></p>
                <p style="margin:0;">Qty: ${item.quantity || 1}</p>
                ${
                  item.size
                    ? `<p style="margin:0;">Size: ${item.size}</p>`
                    : ""
                }
                <p style="margin:0;">₦${Number(
                  item.price
                ).toLocaleString()}</p>
              </div>
            </div>
          `
        )
        .join("")}

      <hr style="margin:20px 0;" />
      <p style="font-size:12px; color:#777;">
        Order Ref: ${reference}
      </p>
    </div>
  `,
});

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
}
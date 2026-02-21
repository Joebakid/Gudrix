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
      to: "01gudrix@gmail.com", // change this
      subject: "New Order Received 🛒",
      html: `
        <h2>New Order</h2>
        <p><strong>Name:</strong> ${customer.fullName}</p>
        <p><strong>Email:</strong> ${customer.email}</p>
        <p><strong>Phone:</strong> ${customer.phone}</p>
        <p><strong>Total:</strong> ₦${total}</p>
        <hr/>
        <h3>Items:</h3>
        ${cart
          .map(
            (item) =>
              `<p>${item.name} - Qty: ${item.quantity}</p>`
          )
          .join("")}
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
}
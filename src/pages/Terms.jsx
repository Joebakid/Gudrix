// src/pages/Terms.jsx

export default function Terms() {
  return (
    <section className="min-h-screen px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">
          Terms & Conditions
        </h1>

        <p className="mb-6 text-sm leading-relaxed">
          By using this website and purchasing from Gudrix, you agree to the
          following terms:
        </p>

        <div className="space-y-8 text-sm leading-relaxed">
          <div>
            <h2 className="font-semibold mb-2">
              1. Products & Pricing
            </h2>
            <p>
              All products are subject to availability. Prices are listed in NGN
              and may change without notice. Gudrix reserves the right to correct
              pricing errors at any time.
            </p>
          </div>

          <div>
            <h2 className="font-semibold mb-2">
              2. Orders & Payment
            </h2>
            <p>
              Orders are processed only after full payment confirmation. Gudrix
              reserves the right to cancel suspicious or fraudulent transactions.
            </p>
          </div>

          <div>
            <h2 className="font-semibold mb-2">
              3. Delivery
            </h2>
            <p>
              Delivery timelines vary by location. Gudrix is not responsible for
              delays caused by courier services or incorrect delivery information
              provided by customers.
            </p>
          </div>

          <div>
            <h2 className="font-semibold mb-2">
              4. Returns & Refunds
            </h2>
            <p>
              Returns must be requested within 48 hours of delivery. Items must
              be unused and in original condition. Refunds are processed after
              inspection and approval.
            </p>
          </div>

          <div>
            <h2 className="font-semibold mb-2">
              5. Liability
            </h2>
            <p>
              Gudrix is not liable for indirect losses or damages beyond the
              value of the purchased product.
            </p>
          </div>

          <div>
            <h2 className="font-semibold mb-2">
              6. Use of Website
            </h2>
            <p>
              Users must not engage in fraudulent, abusive, or unlawful activity
              on this website.
            </p>
          </div>
        </div>

        <p className="mt-12 text-xs opacity-60">
          Last updated: {new Date().getFullYear()}
        </p>
      </div>
    </section>
  );
}
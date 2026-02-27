// src/pages/Privacy.jsx

export default function Privacy() {
  return (
    <section className="min-h-screen px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">
          Privacy Policy
        </h1>

        <p className="mb-6 text-sm leading-relaxed">
          Gudrix values your privacy. This policy explains how we collect, use,
          and protect your information.
        </p>

        <div className="space-y-8 text-sm leading-relaxed">
          <div>
            <h2 className="font-semibold mb-2">
              1. Information We Collect
            </h2>
            <p>
              We may collect personal information such as your name, phone
              number, email address, and delivery address when you place an
              order.
            </p>
          </div>

          <div>
            <h2 className="font-semibold mb-2">
              2. How We Use Your Information
            </h2>
            <p>
              Your information is used to process orders, communicate with you,
              and improve our services. We do not sell your personal data.
            </p>
          </div>

          <div>
            <h2 className="font-semibold mb-2">
              3. Payment Information
            </h2>
            <p>
              Payments are processed through secure third-party payment
              providers. Gudrix does not store your full payment details.
            </p>
          </div>

          <div>
            <h2 className="font-semibold mb-2">
              4. Data Protection
            </h2>
            <p>
              We implement reasonable security measures to protect your
              personal information from unauthorized access or misuse.
            </p>
          </div>

          <div>
            <h2 className="font-semibold mb-2">
              5. Changes to This Policy
            </h2>
            <p>
              Gudrix may update this Privacy Policy from time to time. Updates
              will be posted on this page.
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
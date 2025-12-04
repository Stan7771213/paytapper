export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6 py-12">
      <h1 className="text-4xl md:text-6xl font-bold text-center mb-6">
        Paytapper
      </h1>

      <p className="text-lg md:text-2xl text-gray-300 text-center max-w-xl mb-8">
        A simple and fast platform for receiving tips online.
        Clients get a personal link and QR code. Payments go directly
        to Stripe accounts — instantly and securely.
      </p>

      <a
        href="/admin"
        className="px-6 py-3 rounded-lg bg-white text-black font-semibold text-lg hover:bg-gray-200 transition"
      >
        Register a Client
      </a>

      <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        <div className="p-6 border border-gray-700 rounded-xl text-center">
          <h3 className="text-xl font-semibold mb-2">Direct Payments</h3>
          <p className="text-gray-400">
            Money goes directly to your Stripe account. Instant payouts.
          </p>
        </div>

        <div className="p-6 border border-gray-700 rounded-xl text-center">
          <h3 className="text-xl font-semibold mb-2">QR Code for Clients</h3>
          <p className="text-gray-400">
            Generate QR codes that visitors can scan to send tips instantly.
          </p>
        </div>

        <div className="p-6 border border-gray-700 rounded-xl text-center">
          <h3 className="text-xl font-semibold mb-2">Low Commission</h3>
          <p className="text-gray-400">
            Paytapper collects only 10% from every transaction.
          </p>
        </div>
      </section>
    </main>
  );
}


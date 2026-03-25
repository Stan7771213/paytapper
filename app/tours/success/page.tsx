export const runtime = "nodejs";

export default function ToursSuccessPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-[#E7FF00]/30 bg-[#111111] p-8 shadow-[0_0_0_1px_rgba(231,255,0,0.08)]">
        <div className="mb-4 inline-flex rounded-full bg-[#E7FF00] px-4 py-1 text-sm font-semibold text-black">
          Booking confirmed
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Payment successful
        </h1>

        <p className="mt-4 text-lg text-gray-300">
          Thank you. Your payment for the tour was successful.
        </p>

        <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black p-5 text-sm text-gray-300">
          <p>We have received your booking request and payment.</p>
          <p>
            You will receive a booking confirmation by email with your tour details and meeting
            point information.
          </p>
          <p>
            Tickets are non-refundable and non-exchangeable after purchase.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="/tours/tallinn-old-town"
            className="rounded-2xl bg-[#E7FF00] px-5 py-3 text-center font-semibold text-black"
          >
            Back to tour page
          </a>
          <a
            href="/"
            className="rounded-2xl border border-white/20 px-5 py-3 text-center font-semibold text-white"
          >
            Back to homepage
          </a>
        </div>
      </div>
    </main>
  );
}

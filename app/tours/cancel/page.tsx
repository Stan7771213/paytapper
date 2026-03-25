export const runtime = "nodejs";

export default function ToursCancelPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#111111] p-8">
        <div className="mb-4 inline-flex rounded-full border border-white/20 px-4 py-1 text-sm font-semibold text-white">
          Payment not completed
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Booking was not completed
        </h1>

        <p className="mt-4 text-lg text-gray-300">
          Your payment was cancelled or not completed.
        </p>

        <p className="mt-4 text-gray-400">
          You can go back to the tour booking page and try again.
        </p>

        <div className="mt-8">
          <a
            href="/tours/tallinn-old-town"
            className="inline-block rounded-2xl bg-[#E7FF00] px-5 py-3 font-semibold text-black"
          >
            Return to booking
          </a>
        </div>
      </div>
    </main>
  );
}

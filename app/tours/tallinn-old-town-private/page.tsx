export const runtime = 'nodejs';

export default function TallinnOldTownPrivateTourPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.08fr_0.92fr]">
        <section className="space-y-6">
          <div className="inline-flex items-center rounded-full bg-[#E7FF00] px-4 py-1 text-sm font-semibold text-black">
            120° Private Tour
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Tallinn Old Town Private Walking Tour
            </h1>
            <p className="max-w-2xl text-base text-gray-300 md:text-lg">
              Enjoy a private 2-hour walking tour through the highlights of Tallinn Old Town with
              your own guide.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <div className="rounded-full border border-white/20 px-4 py-2 text-sm text-white">
                €150 for 1–4 guests
              </div>
              <div className="rounded-full border border-white/20 px-4 py-2 text-sm text-white">
                €200 for 5–15 guests
              </div>
              <div className="rounded-full border border-white/20 px-4 py-2 text-sm text-white">
                Duration: 2 hours
              </div>
              <div className="rounded-full border border-white/20 px-4 py-2 text-sm text-white">
                Start time: 16:00
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            <div className="flex aspect-[16/10] w-full items-center justify-center bg-neutral-900 text-center text-gray-400">
              Private tour booking page
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-white">Meeting point</h2>
            <p className="mt-3 leading-7 text-gray-300">
              The private tour starts from Town Hall Square. Full booking flow will be available on
              this page very soon.
            </p>
          </div>
        </section>

        <aside>
          <div className="space-y-5 rounded-3xl border border-[#E7FF00]/30 bg-[#111111] p-6 shadow-[0_0_0_1px_rgba(231,255,0,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-[#E7FF00]">Private tour</p>
                <h2 className="text-2xl font-semibold text-white">Booking opens soon</h2>
              </div>
              <div className="rounded-full bg-[#E7FF00] px-3 py-1 text-sm font-semibold text-black">
                120°
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-gray-300">
              This page is being prepared for live bookings.
              <br />
              <br />
              Please use this exact link for QR materials — the full private tour booking flow will
              be enabled on the same page.
            </div>

            <div className="rounded-2xl border border-[#E7FF00]/20 bg-[#E7FF00]/10 p-4 text-sm text-[#F3FF94]">
              Temporary status: landing page is live, booking flow is coming next.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

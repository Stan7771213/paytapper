'use client';

import Script from 'next/script';

const CAPTAINBOOK_WIDGET_SRC = 'https://120-degrees-ou.captainbook.io/widget.js';
const CAPTAINBOOK_BOOKING_URL =
  'https://120-degrees-ou.captainbook.io/en/embedded/product/1?wid=2';

export function CaptainBookWidgetButton() {
  return (
    <>
      <Script
        id="captainbook-js"
        src={CAPTAINBOOK_WIDGET_SRC}
        strategy="afterInteractive"
      />

      <div className="space-y-5 rounded-3xl border border-[#E7FF00]/30 bg-[#111111] p-6 shadow-[0_0_0_1px_rgba(231,255,0,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-[#E7FF00]">
              Book your group tour
            </p>
            <h2 className="text-2xl font-semibold text-white">Reserve with CaptainBook</h2>
          </div>
          <div className="rounded-full bg-[#E7FF00] px-3 py-1 text-sm font-semibold text-black">
            120°
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black p-4 text-sm leading-6 text-gray-300">
          <p>
            Live availability and booking are handled by CaptainBook.
          </p>
          <p className="mt-3">
            Tap the button below to choose your date and time and complete your booking.
          </p>
        </div>

        <a
          href={CAPTAINBOOK_BOOKING_URL}
          className="block w-full rounded-2xl bg-[#E7FF00] px-4 py-3 text-center font-semibold text-black"
        >
          Book now
        </a>

        <div className="rounded-2xl border border-white/10 bg-black p-4 text-xs leading-6 text-gray-400">
          Tickets are non-refundable and non-exchangeable after purchase.
        </div>
      </div>
    </>
  );
}

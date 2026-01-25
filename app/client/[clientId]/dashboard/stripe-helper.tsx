"use client";

import { useState } from "react";

export function StripeHelperCollapsed() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-md border border-gray-800 bg-black/30 p-3 text-xs text-gray-300">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-medium">
          Why does Stripe ask for a website?
        </span>
        <span className="text-gray-400">{open ? "–" : "+"}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-2 text-gray-400">
          <p>
            Stripe requires a website field during onboarding.
            If you don’t have a site yet, you can use:
          </p>

          <p>
            <a
              href="https://paytapper.net"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-400 hover:text-blue-300"
            >
              https://paytapper.net
            </a>
          </p>

          <p>
            You can change it later in your Stripe settings.
          </p>
        </div>
      )}
    </div>
  );
}

export function StripeDashboardHelperCollapsed() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-md border border-gray-800 bg-black/30 p-3 text-xs text-gray-300">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-medium">
          Do I need to open Stripe dashboard?
        </span>
        <span className="text-gray-400">{open ? "–" : "+"}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-2 text-gray-400">
          <p>
            Not usually. You only need it if you want to change your payout
            details (bank account), complete verification, or view payouts.
          </p>
        </div>
      )}
    </div>
  );
}

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    redirect(`/client/${session.clientId}/dashboard`);
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-gray-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-white/10 flex items-center justify-center text-sm font-bold">
              P
            </div>
            <span className="text-sm font-semibold tracking-wide">
              Paytapper
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <a href="#how-it-works" className="hover:text-white">
              How it works
            </a>
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="/register" className="hover:text-white">
              Get started
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1">
        <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 md:flex-row md:items-center">
          <div className="flex-1 space-y-5">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
              INSTANT TIPS & SMALL PAYMENTS
            </p>
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
              Accept tips directly
              <br />
              to your Stripe account.
            </h1>
            <p className="text-sm text-gray-400 md:max-w-md">
              Paytapper lets your guests send tips or small payments using Stripe.
              No apps, no registration for customers — just scan, choose amount
              and pay.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
              >
                Create your Paytapper link
              </a>
              <p className="text-xs text-gray-500">
                Free to start · Live Stripe payments
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2 text-[11px] text-gray-500">
              <span className="rounded-full border border-gray-700 px-3 py-1">
                Powered by Stripe
              </span>
              <span className="rounded-full border border-gray-700 px-3 py-1">
                Apple Pay & cards
              </span>
              <span className="rounded-full border border-gray-700 px-3 py-1">
                No app for customers
              </span>
            </div>
          </div>

          {/* Real demo CTA */}
          <div className="flex-1">
            <div className="mx-auto w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-950/70 p-6 space-y-4">
              <p className="text-sm font-semibold">
                Want to see how it looks for guests?
              </p>
              <p className="text-xs text-gray-400">
                Open a real Paytapper tip page. This is a live demo.
              </p>
              <a
                href="/tip/demo"
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
              >
                Open demo tip page
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t border-gray-900 bg-black/90"
      >
        <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
          <h2 className="text-lg font-semibold">How Paytapper works</h2>
          <div className="grid gap-6 md:grid-cols-3 text-sm">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400">STEP 1</p>
              <p className="font-medium">Create your account</p>
              <p className="text-gray-400">
                Register and connect your Stripe account.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400">STEP 2</p>
              <p className="font-medium">Share your link or QR</p>
              <p className="text-gray-400">
                Send the link or print the QR code for guests.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400">STEP 3</p>
              <p className="font-medium">Receive money</p>
              <p className="text-gray-400">
                Guests pay — money goes directly to your Stripe account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-gray-900 bg-black">
        <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
          <h2 className="text-lg font-semibold">Why Paytapper</h2>
          <div className="grid gap-6 md:grid-cols-2 text-sm">
            <div>
              <p className="font-medium">90% to you</p>
              <p className="text-gray-400">
                We take a simple 10% platform fee. No subscriptions.
              </p>
            </div>
            <div>
              <p className="font-medium">No customer friction</p>
              <p className="text-gray-400">
                No apps, no sign-ups. Just pay.
              </p>
            </div>
            <div>
              <p className="font-medium">Stripe-level security</p>
              <p className="text-gray-400">
                Payments handled entirely by Stripe.
              </p>
            </div>
            <div>
              <p className="font-medium">Built for real-world services</p>
              <p className="text-gray-400">
                Guides, drivers, freelancers, events.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-black">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-5 text-[11px] text-gray-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Paytapper · St Data OÜ</p>
          <div className="flex flex-wrap gap-3">
            <span>Powered by Stripe</span>
            <span>Made in Estonia</span>
            <a href="mailto:stan.master4@gmail.com" className="hover:text-white">
              Contact support
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

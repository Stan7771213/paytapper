export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Top bar */}
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
            <a href="#cta" className="hidden sm:inline hover:text-white">
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
              Accept tips to your bank account
              <br />
              in just a few taps.
            </h1>
            <p className="text-sm text-gray-400 md:max-w-md">
              Paytapper lets your guests send tips or small payments using
              Stripe. No apps to install, no registration for the customer —
              just scan, choose amount and pay.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#cta"
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
              >
                Get started
              </a>
              <p className="text-xs text-gray-500">
                Works great for guides, drivers, waiters, freelancers and more.
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
                No app for the customer
              </span>
            </div>
          </div>

          {/* Simple mock block */}
          <div className="flex-1">
            <div className="mx-auto w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-950/70 p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs text-gray-400">Example tip page</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                  Live powered
                </span>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Send a tip</p>
                  <p className="text-3xl font-semibold">€10</p>
                  <p className="text-[11px] text-gray-500">
                    90% to the receiver, 10% platform fee.
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  {[5, 10, 20, 50].map((v) => (
                    <div
                      key={v}
                      className="rounded-xl border border-gray-800 bg-gray-900/70 py-2 text-center text-xs"
                    >
                      €{v}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="h-8 rounded-xl bg-gray-900/80" />
                  <div className="h-8 rounded-xl bg-white text-center text-xs font-semibold text-black flex items-center justify-center">
                    Pay with Stripe
                  </div>
                </div>
              </div>
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
              <p className="font-medium">Create your Paytapper link</p>
              <p className="text-gray-400">
                You get a unique tip page connected to your Stripe account.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400">STEP 2</p>
              <p className="font-medium">Share QR or link</p>
              <p className="text-gray-400">
                Print the QR code, send the link, or add it to your website or
                social media.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400">STEP 3</p>
              <p className="font-medium">Receive money</p>
              <p className="text-gray-400">
                Guest chooses the amount, pays with card or wallet — money goes
                directly to your account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-gray-900 bg-black">
        <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
          <h2 className="text-lg font-semibold">Why people like Paytapper</h2>
          <div className="grid gap-6 md:grid-cols-2 text-sm">
            <div className="space-y-2">
              <p className="font-medium">90% to the receiver</p>
              <p className="text-gray-400">
                We take a small 10% platform fee — the rest goes directly to the
                guide, driver or creator.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">No app for the customer</p>
              <p className="text-gray-400">
                Your guests don&apos;t need to install anything. Scan, choose,
                pay. That&apos;s it.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Secure Stripe payments</p>
              <p className="text-gray-400">
                All payments are processed by Stripe. You don&apos;t touch
                card data, everything is PCI compliant.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Perfect for tourism & services</p>
              <p className="text-gray-400">
                Walking tours, drivers, freelancers, small events — anywhere
                where cash tips are complicated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section
        id="cta"
        className="border-t border-gray-900 bg-gradient-to-t from-gray-950 to-black"
      >
        <div className="mx-auto max-w-5xl px-4 py-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">
              Ready to accept your first tip with Paytapper?
            </h2>
            <p className="text-sm text-gray-400">
              We&apos;re now in live mode with Stripe. Get your personal link,
              share the QR and start receiving money in minutes.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <a
              href="/tip?clientId=demo"
              className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              Try demo tip page
            </a>
            <p className="text-xs text-gray-500">
              No registration for customer. Real money for you.
            </p>
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


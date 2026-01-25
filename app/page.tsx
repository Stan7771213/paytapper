import Link from "next/link";

export const metadata = {
  title: "Paytapper — QR-based tipping and small payments",
  description:
    "Paytapper is a simple QR-based tipping and small payments platform for waiters, bartenders, guides, drivers and creators in Europe. Powered by Stripe.",
};

export default async function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      <section className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">Paytapper</h1>

        <p className="mt-6 text-xl text-gray-500">
          Simple QR-based tipping and small payments for waiters, bartenders,
          guides, drivers and creators in Europe.
        </p>

        <p className="mt-4 text-lg text-gray-500">
          Create your personal QR code, accept tips and small payments, and get
          paid directly to your Stripe account.
        </p>

        <p className="mt-2 text-sm text-gray-400">
          Paytapper never holds your money. Fee: <span className="font-semibold">10%</span>.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/register"
            className="rounded-md bg-black px-6 py-3 text-white hover:bg-gray-800"
          >
            Create account
          </Link>

          <Link
            href="/login"
            className="rounded-md border border-gray-700 px-6 py-3 text-gray-300 hover:bg-gray-900"
          >
            Log in
          </Link>
        </div>
      </section>

      <section className="mt-24 flex justify-center">
        <div className="rounded-2xl border border-gray-800 bg-black p-6">
          <img
            src="/qr-paytapper.svg"
            alt="Paytapper QR code"
            className="h-64 w-64"
          />
        </div>
      </section>

      <section className="mt-24 text-center">
        <h2 className="text-3xl font-semibold">Powered by Stripe</h2>

        <p className="mt-6 text-lg text-gray-500">
          All payments are processed by Stripe and go directly to your personal
          Stripe account.
        </p>

        <p className="mt-2 text-sm text-gray-400">
          Paytapper does not store or control your funds.
        </p>
      </section>

      <section className="mt-24 text-center">
        <h2 className="text-3xl font-semibold">How it works</h2>

        <ol className="mt-8 space-y-3 text-lg text-gray-500">
          <li>Create your Paytapper account</li>
          <li>Connect Stripe and share your personal QR</li>
          <li>Get paid directly to your Stripe account</li>
        </ol>
      </section>

      <section className="mt-24">
        <div className="text-center">
          <h2 className="text-3xl font-semibold">FAQ</h2>
          <p className="mt-4 text-lg text-gray-500">
            Quick answers to the most common questions.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-800 bg-black p-6">
            <h3 className="text-lg font-semibold text-white">
              Where does the money go?
            </h3>
            <p className="mt-3 text-gray-400">
              Payments go directly to your connected Stripe account. Paytapper
              doesn’t hold your funds.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-black p-6">
            <h3 className="text-lg font-semibold text-white">
              When do I get paid?
            </h3>
            <p className="mt-3 text-gray-400">
              Payout timing depends on Stripe and your payout schedule. First
              payouts can be temporarily delayed by Stripe.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-black p-6">
            <h3 className="text-lg font-semibold text-white">
              Why do you ask for a website?
            </h3>
            <p className="mt-3 text-gray-400">
              Stripe requires a “Website” field during onboarding. If you don’t
              have one, you can use <span className="font-semibold">https://paytapper.net</span>.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-black p-6">
            <h3 className="text-lg font-semibold text-white">
              What’s the Paytapper fee?
            </h3>
            <p className="mt-3 text-gray-400">
              Paytapper charges <span className="font-semibold">10%</span> per successful payment.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-black p-6 md:col-span-2">
            <h3 className="text-lg font-semibold text-white">
              Do I need to connect Stripe again?
            </h3>
            <p className="mt-3 text-gray-400">
              No. If Stripe is already connected, you’re ready to accept payments.
              You only need to open Stripe if you want to change details like your{" "}
              <span className="font-semibold">bank account</span>, payout settings, or verification.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

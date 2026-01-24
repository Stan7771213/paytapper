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
          Paytapper never holds your money.
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
    </main>
  );
}

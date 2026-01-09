import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/sessions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    redirect(`/client/${session.clientId}/dashboard`);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          Paytapper
        </h1>

        <p className="mt-6 text-xl text-gray-500">
          Simple QR-based tipping and small payments for waiters, bartenders,
          guides, drivers and creators in Europe.
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

      {/* QR visual */}
      <section className="mt-24 flex justify-center">
        <div className="rounded-2xl border border-gray-800 bg-black p-6">
          <img
            src="/qr-paytapper.svg"
            alt="Paytapper QR code"
            className="h-64 w-64"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="mt-24 text-center">
        <h2 className="text-3xl font-semibold">
          How it works
        </h2>

        <ol className="mt-8 space-y-3 text-lg text-gray-500">
          <li>Create your Paytapper account</li>
          <li>Share your personal QR or payment link</li>
          <li>Get paid via Stripe</li>
        </ol>
      </section>

      {/* Trust */}
      <section className="mt-24 text-center">
        <h2 className="text-3xl font-semibold">
          Transparent and secure
        </h2>

        <ul className="mt-8 space-y-3 text-lg text-gray-500">
          <li>Payments are processed by Stripe</li>
          <li>No hidden fees</li>
          <li>
            <strong>Paytapper fee: 10%</strong>
          </li>
          <li>Payouts go directly to your Stripe account</li>
        </ul>
      </section>

      {/* Who it's for */}
      <section className="mt-24 text-center">
        <h2 className="text-3xl font-semibold">
          Who it’s for
        </h2>

        <p className="mt-8 text-lg text-gray-500">
          Waiters & bartenders · Tour guides · Drivers · Local experts · Creators
        </p>
      </section>

      {/* Final CTA */}
      <section className="mt-24 text-center">
        <Link
          href="/register"
          className="inline-block rounded-md bg-black px-8 py-4 text-lg text-white hover:bg-gray-800"
        >
          Create your Paytapper account
        </Link>

        <p className="mt-4 text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}

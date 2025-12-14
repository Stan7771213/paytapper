import Link from "next/link";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = {
  session_id?: string | string[];
};

type SuccessPageProps = {
  searchParams: Promise<SearchParams>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = first(params.session_id);

  if (!sessionId) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold">Missing session ID</h1>
          <p className="text-gray-400">We could not verify your payment.</p>
          <Link href="/" className="text-sm underline text-gray-300 hover:text-white">
            Return to homepage
          </Link>
        </div>
      </main>
    );
  }

  let amountTotal: number | null = null;
  let currency: string = "eur";
  let clientId: string | null = null;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (typeof session.amount_total === "number") {
      amountTotal = session.amount_total;
    }

    if (typeof session.currency === "string") {
      currency = session.currency;
    }

    const pi = session.payment_intent;
    if (pi && typeof pi === "object") {
      const paymentIntent = pi as Stripe.PaymentIntent;
      const cid = paymentIntent.metadata?.clientId;
      clientId = typeof cid === "string" && cid.trim() ? cid : null;
    }
  } catch (err) {
    console.error("Stripe error:", err);
  }

  const amountText =
    amountTotal === null ? null : (amountTotal / 100).toFixed(2);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-gray-800 bg-gray-950/80 rounded-2xl p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">✓</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold">Payment Successful</h1>

        {amountText ? (
          <p className="text-lg">
            You sent{" "}
            <span className="font-semibold">
              {currency === "eur" ? "€" : ""}
              {amountText}
            </span>
          </p>
        ) : (
          <p className="text-gray-400 text-sm">Payment amount unavailable</p>
        )}

        {clientId ? (
          <Link
            href={`/tip/${encodeURIComponent(clientId)}`}
            className="block w-full py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition"
          >
            Send another tip
          </Link>
        ) : (
          <Link
            href="/"
            className="block w-full py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition"
          >
            Return to homepage
          </Link>
        )}

        <Link
          href="/"
          className="block w-full py-3 rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-800 transition"
        >
          Return to homepage
        </Link>

        <p className="text-[11px] text-gray-500 pt-4">
          Powered by Paytapper and Stripe.
        </p>
      </div>
    </main>
  );
}

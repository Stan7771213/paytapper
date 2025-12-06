import Stripe from "stripe";
import Link from "next/link";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

const stripe = new Stripe(stripeSecretKey);

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParamsPromise = Promise<{
  [key: string]: string | string[] | undefined;
}>;

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  const params = await searchParams;

  const rawSessionId = params.session_id;
  const rawClientId = params.clientId;

  const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;
  const clientId =
    (Array.isArray(rawClientId) ? rawClientId[0] : rawClientId) || "unknown";

  if (!sessionId) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold">Missing session ID</h1>
          <p className="text-gray-400">We could not verify your payment.</p>
          <Link
            href="/"
            className="text-sm underline text-gray-300 hover:text-white"
          >
            Return to homepage
          </Link>
        </div>
      </main>
    );
  }

  let amountTotal: number | null = null;
  let currency: string | null = null;
  let metadata: Record<string, string> = {};

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (typeof session.amount_total === "number") {
      amountTotal = session.amount_total;
    }

    currency = session.currency || "eur";

    if (session.payment_intent && typeof session.payment_intent === "object") {
      const pi = session.payment_intent as Stripe.PaymentIntent;
      metadata = (pi.metadata as any) ?? {};
    }
  } catch (err) {
    console.error("Stripe error:", err);
  }

  const euro = amountTotal ? (amountTotal / 100).toFixed(2) : null;

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-gray-800 bg-gray-950/80 backdrop-blur-sm rounded-2xl p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">✓</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold">Payment Successful</h1>

        {euro ? (
          <p className="text-lg">
            You sent <span className="font-semibold">€{euro}</span>
          </p>
        ) : (
          <p className="text-gray-400 text-sm">Payment amount unavailable</p>
        )}

        <p className="text-sm text-gray-400">
          Client ID:{" "}
          <span className="font-mono text-gray-300">{clientId}</span>
        </p>

        <div className="pt-4 space-y-3">
          <Link
            href={`/tip?clientId=${encodeURIComponent(clientId)}`}
            className="block w-full py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition"
          >
            Send another tip
          </Link>

        <Link
            href="/"
            className="block w-full py-3 rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-800 transition"
          >
            Return to homepage
          </Link>
        </div>

        <p className="text-[11px] text-gray-500 pt-4">
          Powered by Paytapper and Stripe.
        </p>
      </div>
    </main>
  );
}


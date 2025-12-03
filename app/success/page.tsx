import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

type SuccessPageProps = {
  // В новых версиях Next.js searchParams — это Promise
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;

  const rawSessionId = params.session_id;
  const sessionId =
    Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;

  if (!sessionId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl shadow-lg p-6 flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-center">Payment status</h1>
          <p className="text-center text-sm text-red-600">
            Missing session_id in the URL.
          </p>
        </div>
      </main>
    );
  }

  let amountTotal: number | null = null;
  let currency: string | null = null;
  let guideId: string | null = null;
  let errorMessage: string | null = null;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    amountTotal = (session.amount_total ?? null) as number | null;
    currency = (session.currency ?? null) as string | null;

    const sessionGuideId =
      (session.metadata && (session.metadata as any).guideId) || null;

    let piGuideId: string | null = null;

    const paymentIntent = session.payment_intent;

    if (paymentIntent && typeof paymentIntent === "object") {
      const pi = paymentIntent as Stripe.PaymentIntent;
      piGuideId =
        (pi.metadata && (pi.metadata as any).guideId) || null;
    }

    guideId = sessionGuideId || piGuideId;
  } catch (err: any) {
    console.error("Error loading checkout session:", err);
    errorMessage = err?.message || "Failed to load session details";
  }

  const formattedAmount =
    amountTotal && currency
      ? `${(amountTotal / 100).toFixed(2)} ${currency.toUpperCase()}`
      : null;

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl shadow-lg p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">
          Thank you for your tip! 🙏
        </h1>

        {errorMessage ? (
          <p className="text-center text-sm text-red-600">{errorMessage}</p>
        ) : (
          <>
            {formattedAmount && (
              <p className="text-center text-lg font-semibold">
                Amount: {formattedAmount}
              </p>
            )}

            {guideId && (
              <p className="text-center text-sm text-gray-700">
                Guide ID: <span className="font-mono">{guideId}</span>
              </p>
            )}

            {!guideId && (
              <p className="text-center text-sm text-gray-500">
                Guide ID was not found in the payment metadata.
              </p>
            )}

            <p className="text-center text-sm text-gray-600 mt-2">
              You can close this page now.
            </p>
          </>
        )}
      </div>
    </main>
  );
}


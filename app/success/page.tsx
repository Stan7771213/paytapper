import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-11-17.clover",
});

type SuccessPageProps = {
  // В новых версиях Next searchParams — это Promise
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

  let amountTotalCents: number | null = null;
  let currency: string | null = null;
  let guideId: string | null = null;
  let platformFeePercent: number | null = null;
  let platformFeeCents: number | null = null;
  let guideAmountCents: number | null = null;
  let errorMessage: string | null = null;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    amountTotalCents =
      typeof session.amount_total === "number" ? session.amount_total : null;
    currency = (session.currency ?? null) as string | null;

    // metadata из сессии
    const sessionMeta =
      (session.metadata as Record<string, string | undefined>) || {};

    // metadata из payment_intent (если есть)
    let piMeta: Record<string, string | undefined> = {};
    const paymentIntent = session.payment_intent;

    if (paymentIntent && typeof paymentIntent === "object") {
      const pi = paymentIntent as Stripe.PaymentIntent;
      piMeta = (pi.metadata as Record<string, string | undefined>) || {};
    }

    const mergedMeta: Record<string, string | undefined> = {
      ...sessionMeta,
      ...piMeta,
    };

    if (mergedMeta.guideId) {
      guideId = mergedMeta.guideId;
    }

    if (mergedMeta.totalAmountCents) {
      const v = parseInt(mergedMeta.totalAmountCents, 10);
      if (!Number.isNaN(v)) amountTotalCents = v;
    }

    if (mergedMeta.platformFeePercent) {
      const v = parseFloat(mergedMeta.platformFeePercent);
      if (!Number.isNaN(v)) platformFeePercent = v;
    }

    if (mergedMeta.platformFeeCents) {
      const v = parseInt(mergedMeta.platformFeeCents, 10);
      if (!Number.isNaN(v)) platformFeeCents = v;
    }

    if (mergedMeta.guideAmountCents) {
      const v = parseInt(mergedMeta.guideAmountCents, 10);
      if (!Number.isNaN(v)) guideAmountCents = v;
    }
  } catch (err: any) {
    console.error("Error loading checkout session:", err);
    errorMessage = err?.message || "Failed to load session details";
  }

  const formattedTotal =
    amountTotalCents && currency
      ? `${(amountTotalCents / 100).toFixed(2)} ${currency.toUpperCase()}`
      : null;

  const formattedGuideAmount =
    guideAmountCents && currency
      ? `${(guideAmountCents / 100).toFixed(2)} ${currency.toUpperCase()}`
      : null;

  const formattedPlatformFee =
    platformFeeCents && currency
      ? `${(platformFeeCents / 100).toFixed(2)} ${currency.toUpperCase()}`
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
            {formattedTotal && (
              <p className="text-center text-lg font-semibold">
                Amount: {formattedTotal}
              </p>
            )}

            {formattedGuideAmount && (
              <p className="text-center text-sm text-gray-700">
                Guide will receive:{" "}
                <span className="font-semibold">{formattedGuideAmount}</span>
              </p>
            )}

            {formattedPlatformFee && platformFeePercent != null && (
              <p className="text-center text-xs text-gray-500">
                Platform fee ({platformFeePercent}%): {formattedPlatformFee}
              </p>
            )}

            {guideId && (
              <p className="text-center text-sm text-gray-700 mt-2">
                Guide ID: <span className="font-mono">{guideId}</span>
              </p>
            )}

            {!guideId && (
              <p className="text-center text-sm text-gray-500 mt-2">
                Guide ID was not found in the payment metadata.
              </p>
            )}

            <p className="text-center text-sm text-gray-600 mt-4">
              You can close this page now.
            </p>
          </>
        )}
      </div>
    </main>
  );
}


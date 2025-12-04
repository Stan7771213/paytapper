import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-11-17.clover",
});

type GuideDashboardPageProps = {
  params: {
    guideId: string;
  };
};

type PaymentRow = {
  id: string;
  created: number;
  amountTotalCents: number;
  guideAmountCents: number;
  platformFeeCents: number;
  currency: string;
};

export default async function GuideDashboardPage({
  params,
}: GuideDashboardPageProps) {
  const guideId = params.guideId;

  let payments: PaymentRow[] = [];
  let totalTipsCents = 0;
  let totalGuideCents = 0;
  let totalPlatformFeeCents = 0;
  let errorMessage: string | null = null;

  try {
    // Ищем последние payment_intents с нужным guideId
    const searchResult = await stripe.paymentIntents.search({
      // Stripe Search API: ищем по metadata.guideId и статусу succeeded
      query: `metadata['guideId']:'${guideId}' AND status:'succeeded'`,
      limit: 30,
    });

    payments = searchResult.data.map((pi) => {
      const meta =
        (pi.metadata as Record<string, string | undefined>) || {};

      const currency = (pi.currency ?? "eur").toLowerCase();

      const amountTotalCents =
        typeof pi.amount_received === "number"
          ? pi.amount_received
          : typeof pi.amount === "number"
          ? pi.amount
          : 0;

      let guideAmountCents = amountTotalCents;
      let platformFeeCents = 0;

      if (meta.guideAmountCents) {
        const v = parseInt(meta.guideAmountCents, 10);
        if (!Number.isNaN(v)) {
          guideAmountCents = v;
        }
      }

      if (meta.platformFeeCents) {
        const v = parseInt(meta.platformFeeCents, 10);
        if (!Number.isNaN(v)) {
          platformFeeCents = v;
        }
      } else {
        platformFeeCents = amountTotalCents - guideAmountCents;
      }

      totalTipsCents += amountTotalCents;
      totalGuideCents += guideAmountCents;
      totalPlatformFeeCents += platformFeeCents;

      return {
        id: pi.id,
        created: pi.created,
        amountTotalCents,
        guideAmountCents,
        platformFeeCents,
        currency,
      };
    });

    // Сортируем от новых к старым
    payments.sort((a, b) => b.created - a.created);
  } catch (err: any) {
    console.error("Error loading guide payments:", err);
    errorMessage = err?.message || "Failed to load payments";
  }

  const formatMoney = (cents: number, currency: string) =>
    `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="w-full max-w-2xl rounded-2xl shadow-lg p-6 flex flex-col gap-4 bg-[#050509] text-white">
        <h1 className="text-2xl font-bold text-center mb-2">
          Guide dashboard
        </h1>

        <p className="text-center text-sm text-gray-400">
          Guide ID: <span className="font-mono">{guideId}</span>
        </p>

        {errorMessage ? (
          <p className="text-center text-sm text-red-400">{errorMessage}</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mt-2 text-sm">
              <div className="rounded-xl border border-gray-700 p-3 text-center">
                <p className="text-xs text-gray-400">Total tips</p>
                <p className="text-lg font-semibold">
                  {totalTipsCents > 0
                    ? formatMoney(
                        totalTipsCents,
                        payments[0]?.currency || "eur"
                      )
                    : "-"}
                </p>
              </div>
              <div className="rounded-xl border border-gray-700 p-3 text-center">
                <p className="text-xs text-gray-400">Guide earnings</p>
                <p className="text-lg font-semibold">
                  {totalGuideCents > 0
                    ? formatMoney(
                        totalGuideCents,
                        payments[0]?.currency || "eur"
                      )
                    : "-"}
                </p>
              </div>
              <div className="rounded-xl border border-gray-700 p-3 text-center">
                <p className="text-xs text-gray-400">Platform fee</p>
                <p className="text-lg font-semibold">
                  {totalPlatformFeeCents > 0
                    ? formatMoney(
                        totalPlatformFeeCents,
                        payments[0]?.currency || "eur"
                      )
                    : "-"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <h2 className="text-sm font-semibold mb-2 text-gray-300">
                Recent tips
              </h2>

              {payments.length === 0 ? (
                <p className="text-xs text-gray-500">
                  No tips found for this guide yet.
                </p>
              ) : (
                <div className="max-h-80 overflow-y-auto border border-gray-800 rounded-xl">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-900 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-400">
                          Date
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-gray-400">
                          Amount
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-gray-400">
                          Guide
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-gray-400">
                          Platform
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => {
                        const date = new Date(p.created * 1000);
                        const dateStr = date.toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <tr
                            key={p.id}
                            className="border-t border-gray-800 hover:bg-gray-900"
                          >
                            <td className="px-3 py-2 whitespace-nowrap">
                              {dateStr}
                            </td>
                            <td className="px-3 py-2 text-right whitespace-nowrap">
                              {formatMoney(
                                p.amountTotalCents,
                                p.currency
                              )}
                            </td>
                            <td className="px-3 py-2 text-right whitespace-nowrap text-green-400">
                              {formatMoney(
                                p.guideAmountCents,
                                p.currency
                              )}
                            </td>
                            <td className="px-3 py-2 text-right whitespace-nowrap text-gray-400">
                              {formatMoney(
                                p.platformFeeCents,
                                p.currency
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}


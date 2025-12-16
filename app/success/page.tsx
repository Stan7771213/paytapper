import Link from "next/link";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { getAllPayments } from "@/lib/paymentStore";
import { getClientById } from "@/lib/clientStore";
import type { Payment, Client } from "@/lib/types";

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

function formatEurFromCents(cents: number): string {
  const value = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatIsoOrDash(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function shortRef(paymentIntentId: string): string {
  if (!paymentIntentId) return "—";
  const tail = paymentIntentId.slice(-8);
  return `…${tail}`;
}

async function findPaymentByPaymentIntentId(
  paymentIntentId: string
): Promise<Payment | null> {
  const all = await getAllPayments();
  const match = all.find((p) => p.stripe.paymentIntentId === paymentIntentId);
  return match ?? null;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = first(params.session_id);

  const stripeMode = process.env.STRIPE_MODE === "live" ? "live" : "test";

  if (!sessionId) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold">Missing session</h1>
          <p className="text-gray-400">
            We couldn’t verify this payment session. Please return and try again.
          </p>
          <Link href="/" className="text-sm underline text-gray-300 hover:text-white">
            Back to Paytapper
          </Link>
        </div>
      </main>
    );
  }

  let sessionAmountTotal: number | null = null;
  let sessionCurrency: string = "eur";
  let paymentIntentId: string | null = null;
  let clientIdFromStripe: string | null = null;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (typeof session.amount_total === "number") {
      sessionAmountTotal = session.amount_total;
    }

    if (typeof session.currency === "string") {
      sessionCurrency = session.currency;
    }

    const pi = session.payment_intent;
    if (pi && typeof pi === "object") {
      const paymentIntent = pi as Stripe.PaymentIntent;

      if (typeof paymentIntent.id === "string" && paymentIntent.id.startsWith("pi_")) {
        paymentIntentId = paymentIntent.id;
      }

      const cid = paymentIntent.metadata?.clientId;
      clientIdFromStripe = typeof cid === "string" && cid.trim() ? cid : null;
    }
  } catch (err) {
    console.error("Stripe error:", err);
  }

  const persistedPayment = paymentIntentId
    ? await findPaymentByPaymentIntentId(paymentIntentId)
    : null;

  const effectiveClientId = persistedPayment?.clientId ?? clientIdFromStripe ?? null;

  const client: Client | null = effectiveClientId
    ? await getClientById(effectiveClientId)
    : null;

  const branding: Client["branding"] | undefined = client?.branding;
  const title = branding?.title ?? client?.displayName ?? "Paytapper";
  const description = branding?.description;
  const avatarUrl = branding?.avatarUrl;

  const status = persistedPayment?.status ?? (paymentIntentId ? "processing" : "unknown");

  const grossCents = persistedPayment?.amountCents ?? (sessionAmountTotal ?? null);
  const feeCents = persistedPayment?.platformFeeCents ?? null;
  const netCents = persistedPayment?.netAmountCents ?? null;

  const whenIso = persistedPayment?.paidAt ?? persistedPayment?.createdAt ?? undefined;

  const canSendAnotherTip = Boolean(effectiveClientId);

  const headline =
    status === "paid"
      ? "Payment confirmed"
      : status === "processing"
      ? "Preparing your receipt"
      : "Payment details";

  const subcopy =
    description ??
    (status === "paid"
      ? "Thanks! Your payment was successfully processed."
      : status === "processing"
      ? "Stripe has confirmed the payment. We’re finalizing your receipt."
      : "Your payment information is shown below.");

  const statusLabel = (persistedPayment ? persistedPayment.status : status).toUpperCase();

  return (
    <main className="min-h-screen px-4 py-10 text-white bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-800 bg-gray-950/70 backdrop-blur p-6 space-y-5 shadow-sm text-center">
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <p className="text-xs tracking-wide text-gray-400 uppercase">
                Paytapper
              </p>
              <span className="inline-flex items-center rounded-full border border-gray-700 px-2.5 py-1 text-[11px] font-semibold text-gray-200">
                Stripe mode: {stripeMode === "live" ? "LIVE" : "TEST"}
              </span>
            </div>

            {avatarUrl ? (
              <div className="flex items-center justify-center">
                <img
                  src={avatarUrl}
                  alt={`${title} avatar`}
                  className="h-16 w-16 rounded-full border border-gray-800 object-cover"
                />
              </div>
            ) : null}

            <h1 className="text-2xl font-bold">{headline}</h1>

            <p className="text-sm text-gray-400">{subcopy}</p>
          </div>

          {status === "processing" ? (
            <div className="rounded-xl border border-yellow-700/40 bg-yellow-950/30 px-4 py-3 text-left">
              <p className="text-sm text-yellow-200 font-medium">Processing</p>
              <p className="text-xs text-yellow-200/80">
                This can take a few seconds. If it doesn’t update, refresh once.
              </p>
            </div>
          ) : null}

          <div className="rounded-xl border border-gray-800 bg-black/30 px-4 py-4 text-left space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-sm font-medium text-gray-200">{statusLabel}</p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">Date</p>
              <p className="text-sm font-medium text-gray-200">
                {formatIsoOrDash(whenIso)}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">Reference</p>
              <p className="text-sm font-mono text-gray-200">
                {paymentIntentId ? shortRef(paymentIntentId) : "—"}
              </p>
            </div>

            <div className="pt-2 border-t border-gray-800 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-500">Gross</p>
                <p className="text-sm font-semibold text-gray-100">
                  {typeof grossCents === "number" && sessionCurrency === "eur"
                    ? formatEurFromCents(grossCents)
                    : "—"}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-500">Platform fee</p>
                <p className="text-sm font-semibold text-gray-100">
                  {typeof feeCents === "number" ? formatEurFromCents(feeCents) : "—"}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-500">Net</p>
                <p className="text-sm font-semibold text-gray-100">
                  {typeof netCents === "number" ? formatEurFromCents(netCents) : "—"}
                </p>
              </div>
            </div>
          </div>

          {canSendAnotherTip ? (
            <Link
              href={`/tip/${encodeURIComponent(effectiveClientId as string)}`}
              className="block w-full py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-gray-200 transition"
            >
              Leave another tip
            </Link>
          ) : (
            <Link
              href="/"
              className="block w-full py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-gray-200 transition"
            >
              Back to Paytapper
            </Link>
          )}

          <p className="text-[11px] text-gray-500 pt-2">
            Payments are processed by Stripe. A platform fee may apply.
          </p>
        </div>
      </div>
    </main>
  );
}

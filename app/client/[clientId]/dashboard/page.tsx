import { getClientById } from "@/lib/clientStore";
import { getPaymentsByClientId } from "@/lib/paymentStore";
import type { Payment } from "@/lib/types";
import { StartOnboardingButton } from "./start-onboarding-button";
import { OpenStripeDashboardButton } from "./open-stripe-dashboard-button";
import { DownloadQrPngButton } from "./download-qr-png-button";
import QRCode from "react-qr-code";

type DashboardPageProps = {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

function getPublicBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit && explicit.trim()) return explicit.trim().replace(/\/+$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim()) {
    const v = vercelUrl.trim().replace(/\/+$/, "");
    return v.startsWith("http") ? v : `https://${v}`;
  }

  return "http://localhost:3000";
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

function getPaymentSortKey(p: Payment): number {
  const iso = p.paidAt ?? p.createdAt;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

function PaymentStats({ payments }: { payments: Payment[] }) {
  const total = payments.length;
  const paid = payments.filter((p) => p.status === "paid");
  const paidCount = paid.length;

  const totalNetPaidCents = paid.reduce((sum, p) => sum + p.netAmountCents, 0);

  const lastPayment = [...payments].sort(
    (a, b) => getPaymentSortKey(b) - getPaymentSortKey(a)
  )[0];

  return (
    <section className="border rounded-lg p-4 space-y-3">
      <h2 className="font-semibold">Tips overview</h2>

      {total === 0 ? (
        <p className="text-sm text-gray-600">
          No tips yet. As soon as someone completes a payment, it will appear
          here automatically.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-md border p-3">
            <p className="text-xs text-gray-600">Total payments</p>
            <p className="text-lg font-semibold">{total}</p>
          </div>

          <div className="rounded-md border p-3">
            <p className="text-xs text-gray-600">Paid payments</p>
            <p className="text-lg font-semibold">{paidCount}</p>
          </div>

          <div className="rounded-md border p-3">
            <p className="text-xs text-gray-600">Total paid (net)</p>
            <p className="text-lg font-semibold">
              {formatEurFromCents(totalNetPaidCents)}
            </p>
          </div>

          <div className="rounded-md border p-3">
            <p className="text-xs text-gray-600">Last payment</p>
            <p className="text-sm font-medium">
              {lastPayment ? formatIsoOrDash(lastPayment.paidAt ?? lastPayment.createdAt) : "—"}
            </p>
            {lastPayment ? (
              <p className="text-xs text-gray-600">
                {lastPayment.status.toUpperCase()} •{" "}
                {formatEurFromCents(lastPayment.netAmountCents)} net
              </p>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

function RecentPaymentsList({
  payments,
  limit = 10,
}: {
  payments: Payment[];
  limit?: number;
}) {
  if (payments.length === 0) return null;

  const recent = [...payments]
    .sort((a, b) => getPaymentSortKey(b) - getPaymentSortKey(a))
    .slice(0, limit);

  return (
    <section className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">Recent payments</h3>
        <p className="text-xs text-gray-600">Last {recent.length}</p>
      </div>

      <div className="space-y-2">
        {recent.map((p) => {
          const when = p.paidAt ?? p.createdAt;
          const payer = p.payer?.email ? p.payer.email : "—";
          return (
            <div
              key={p.stripe.paymentIntentId}
              className="rounded-md border p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{formatIsoOrDash(when)}</p>
                <p className="text-xs text-gray-600">
                  {p.status.toUpperCase()}
                </p>
              </div>

              <div className="mt-1 grid grid-cols-1 sm:grid-cols-3 gap-1 text-sm">
                <p>
                  <span className="text-gray-600">Gross:</span>{" "}
                  {formatEurFromCents(p.amountCents)}
                </p>
                <p>
                  <span className="text-gray-600">Net:</span>{" "}
                  {formatEurFromCents(p.netAmountCents)}
                </p>
                <p className="break-all">
                  <span className="text-gray-600">Payer:</span> {payer}
                </p>
              </div>

              <p className="mt-2 text-xs text-gray-600 break-all">
                {p.stripe.paymentIntentId} • {p.stripe.checkoutSessionId}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default async function ClientDashboardPage({
  params,
  searchParams,
}: DashboardPageProps) {
  const { clientId } = await params;
  const search = (searchParams ? await searchParams : {}) ?? {};
  const onboardingParam = search.onboarding as string | string[] | undefined;

  const client = await getClientById(clientId);
  const payments = await getPaymentsByClientId(clientId);

  const stripeAccountId = client?.stripe?.accountId ?? null;
  const isConnected = Boolean(stripeAccountId);

  const tipPath = `/tip/${clientId}`;
  const tipUrl = `${getPublicBaseUrl()}${tipPath}`;
  const qrFilename = `paytapper-tip-${clientId}.png`;

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Client dashboard</h1>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="font-semibold">Client info</h2>
        <p>
          <strong>Client ID:</strong> {clientId}
        </p>
        {client?.displayName && (
          <p>
            <strong>Name:</strong> {client.displayName}
          </p>
        )}
        {client?.email && (
          <p>
            <strong>Email:</strong> {client.email}
          </p>
        )}
        {!client && (
          <p className="text-sm text-gray-600">
            No client record yet. It will be created automatically after you
            start Stripe onboarding.
          </p>
        )}
      </section>

      <section className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Tip link & QR</h2>

        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            Share this link or print the QR code:
          </p>

          <p className="break-all">
            <a className="underline" href={tipPath}>
              {tipPath}
            </a>
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <a
              className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50"
              href={tipPath}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open tip page
            </a>

            <DownloadQrPngButton value={tipUrl} filename={qrFilename} />
          </div>

          <p className="break-all text-sm text-gray-600">{tipUrl}</p>

          <div className="pt-2 flex items-center justify-center">
            <div className="bg-white p-3 rounded-lg border">
              <QRCode value={tipUrl} size={180} />
            </div>
          </div>

          <div className="hidden md:block pt-4 space-y-2">
            <p className="text-sm text-gray-700">Preview (desktop only):</p>
            <div className="rounded-lg border overflow-hidden bg-white">
              <iframe
                title="Tip page preview"
                src={tipPath}
                className="w-full"
                style={{ height: 520 }}
                sandbox="allow-same-origin allow-scripts allow-forms"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Stripe account</h2>

        <p>
          <strong>Connection status:</strong>{" "}
          {isConnected ? (
            <span className="text-green-600">Connected</span>
          ) : (
            <span className="text-gray-700">Not connected</span>
          )}
        </p>

        <p>
          <strong>Stripe account ID:</strong> {stripeAccountId ?? "—"}
        </p>

        {onboardingParam === "return" && (
          <p className="text-sm text-green-600">
            You returned from Stripe onboarding. Your account status will update
            shortly.
          </p>
        )}

        {onboardingParam === "refresh" && (
          <p className="text-sm text-yellow-600">
            There was an issue with onboarding. Please try again.
          </p>
        )}

        <StartOnboardingButton clientId={clientId} />

        {isConnected && (
          <div className="pt-3">
            <OpenStripeDashboardButton />
          </div>
        )}
      </section>

      <PaymentStats payments={payments} />
      <RecentPaymentsList payments={payments} limit={10} />
    </main>
  );
}

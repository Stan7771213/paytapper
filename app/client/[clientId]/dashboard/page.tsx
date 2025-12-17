import { getClientById } from "@/lib/clientStore";
import { getPaymentsByClientId } from "@/lib/paymentStore";
import type { StripeConnectState } from "@/lib/stripeConnect";
import { StartOnboardingButton } from "./start-onboarding-button";
import { OpenStripeDashboardButton } from "./open-stripe-dashboard-button";
import { DownloadQrPngButton } from "./download-qr-png-button";
import { CopyTipLinkButton } from "./copy-tip-link-button";
import { DownloadPaymentsCsvButton } from "./download-payments-csv-button";
import { ConnectSyncOnMount } from "./connect-sync-on-mount";
import QRCode from "react-qr-code";

type DashboardPageProps = {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function getStripeConnectState(clientId: string): Promise<StripeConnectState> {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const res = await fetch(
    `${base}/api/connect/status?clientId=${encodeURIComponent(clientId)}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to resolve Stripe Connect status");
  }

  const data: unknown = await res.json();
  if (
    typeof data === "object" &&
    data !== null &&
    "state" in data &&
    typeof (data as { state?: unknown }).state === "string"
  ) {
    return (data as { state: StripeConnectState }).state;
  }

  throw new Error("Invalid Stripe Connect status payload");
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { clientId } = await params;

  const client = await getClientById(clientId);
  if (!client) {
    throw new Error("Client not found");
  }

  const payments = await getPaymentsByClientId(clientId);

  // Derived Stripe state (server-side, canonical)
  const stripeState = await getStripeConnectState(clientId);

  const tipUrl = `/tip/${clientId}`;
  const publicBase =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const fullTipUrl = `${publicBase}${tipUrl}`;

  const canShowTipAssets =
    client.payoutMode === "platform" ||
    (client.payoutMode === "direct" && stripeState === "active");

  // Side-effects live in POST /api/connect/sync, not in GET /status.
  // Run sync on dashboard mount in direct mode until:
  // - state is active, AND
  // - stripeConnected email is stamped as sent.
  const shouldRunConnectSync =
    client.payoutMode === "direct" &&
    (stripeState !== "active" || !client.emailEvents?.stripeConnectedSentAt);

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <ConnectSyncOnMount clientId={clientId} shouldRun={shouldRunConnectSync} />

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <p className="text-sm text-gray-600">
          Stripe status: <strong>{stripeState}</strong>
        </p>
      </header>

      <section className="border rounded-lg p-4 space-y-4">
        <h2 className="font-semibold">Tip QR & link</h2>

        {canShowTipAssets ? (
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <QRCode value={fullTipUrl} size={160} />

            <div className="space-y-2">
              <p className="text-sm break-all">{fullTipUrl}</p>

              <div className="flex flex-wrap gap-2">
                <CopyTipLinkButton text={fullTipUrl} />
                <DownloadQrPngButton
                  value={fullTipUrl}
                  filename={`paytapper-tip-${clientId}.png`}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-gray-50 p-4 space-y-2">
            <p className="text-sm font-medium">Tip link is not active yet</p>
            <p className="text-sm text-gray-600">
              To show your QR code and accept payments in <strong>direct</strong>{" "}
              payout mode, you must finish Stripe onboarding.
            </p>
            <p className="text-xs text-gray-500">
              Current state: <strong>{stripeState}</strong>
            </p>
          </div>
        )}
      </section>

      <section className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Stripe payouts</h2>

        <StartOnboardingButton clientId={clientId} />
        <OpenStripeDashboardButton />
      </section>

      <section className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Payments</h2>
        <DownloadPaymentsCsvButton clientId={clientId} />
        <p className="text-sm text-gray-600">Total payments: {payments.length}</p>
      </section>
    </main>
  );
}

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/sessions";
import { getClientById } from "@/lib/clientStore";
import {
  getPaymentsSummaryByClientId,
  getPaymentsByClientId,
} from "@/lib/paymentStore";
// import { process.env.STRIPE_MODE } from "@/lib/stripe";
import { StartOnboardingButton } from "./start-onboarding-button";
import { LogoutButton } from "./logout-button";
import { DownloadPaymentsCsvButton } from "./download-payments-csv-button";

type Params = { clientId: string };

function formatEur(cents: number): string {
  return (cents / 100).toFixed(2);
}

function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit && explicit.trim()) return explicit.trim();
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim()) {
    return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
  }
  return "http://localhost:3000";
}

function isLocalhost(url: string): boolean {
  return url.includes("localhost") || url.includes("127.0.0.1");
}

async function getStripeState(clientId: string): Promise<"active" | "other"> {
  const res = await fetch(
    `${getBaseUrl()}/api/connect/status?clientId=${encodeURIComponent(clientId)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return "other";
  const data = await res.json();
  return data.state === "active" ? "active" : "other";
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { clientId } = await params;

  const session = await getSession();
  if (!session || session.clientId !== clientId) {
    redirect("/login");
  }

  const client = await getClientById(clientId);
  if (!client) redirect("/login");

  const summary = await getPaymentsSummaryByClientId(clientId);

  const isLive = process.env.STRIPE_MODE === "live";
  const baseUrl = getBaseUrl();
  const tipUrl = `${baseUrl}/tip/${clientId}`;
  const showTestWarning = process.env.STRIPE_MODE === "test" && !isLocalhost(baseUrl);

  const stripeState =
    client.payoutMode === "direct"
      ? await getStripeState(clientId)
      : "active";

  const canShowTip = client.payoutMode !== "direct" || stripeState === "active";

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isLive ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {isLive ? "LIVE" : "TEST"}
          </span>
        </div>
        <LogoutButton />
      </div>

      {showTestWarning && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
          <strong>Test mode:</strong> Do not share this link with real users.
        </div>
      )}

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="font-semibold">Client info</h2>
        <p><strong>Client ID:</strong> {clientId}</p>
        {client.displayName && <p><strong>Name:</strong> {client.displayName}</p>}
        {client.email && <p><strong>Email:</strong> {client.email}</p>}
      </section>

      <section className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Tip link & QR</h2>

        {canShowTip ? (
          <>
            <p className="text-sm break-all">
              <strong>Tip link:</strong><br />
              <a
                href={tipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-500 hover:text-blue-400"
              >
                {tipUrl}
              </a>
            </p>
            <img
              src={`/api/qr?value=${encodeURIComponent(tipUrl)}`}
              alt="Tip QR"
              className="w-40 h-40 border rounded"
            />
          </>
        ) : (
          <p className="text-sm text-gray-500">
            Connect Stripe to start accepting payments.
          </p>
        )}
      </section>

      <section className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Stripe</h2>
        <StartOnboardingButton clientId={clientId} />
      </section>

      <section className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Payments</h2>
        <p><strong>Total received:</strong> {formatEur(summary.totalNetCents)} €</p>
        <DownloadPaymentsCsvButton clientId={clientId} />
      </section>
    </main>
  );
}

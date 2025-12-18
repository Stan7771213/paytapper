import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getClientById } from "@/lib/clientStore";
import {
  getPaymentsSummaryByClientId,
  getPaymentsByClientId,
} from "@/lib/paymentStore";
import { stripeMode } from "@/lib/stripe";
import { StartOnboardingButton } from "./start-onboarding-button";
import { OpenStripeDashboardButton } from "./open-stripe-dashboard-button";
import { LogoutButton } from "./logout-button";
import { DownloadPaymentsCsvButton } from "./download-payments-csv-button";

type PageProps = {
  params: {
    clientId: string;
  };
};

function formatEur(cents: number): string {
  return (cents / 100).toFixed(2);
}

function paymentDateIso(p: { paidAt?: string; createdAt: string }): string {
  return p.paidAt ?? p.createdAt;
}

function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit && explicit.trim()) return explicit.trim();

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim()) {
    return vercelUrl.startsWith("http")
      ? vercelUrl
      : `https://${vercelUrl}`;
  }

  return "http://localhost";
}

function isLocalhost(url: string): boolean {
  return url.includes("localhost") || url.includes("127.0.0.1");
}

export default async function DashboardPage({ params }: PageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.clientId !== params.clientId) {
    notFound();
  }

  const client = await getClientById(params.clientId);
  const summary = await getPaymentsSummaryByClientId(params.clientId);

  const payments = await getPaymentsByClientId(params.clientId);
  const recentPayments = payments
    .slice()
    .sort(
      (a, b) =>
        paymentDateIso(b).localeCompare(paymentDateIso(a))
    )
    .slice(0, 5);

  const isLive = stripeMode === "live";
  const baseUrl = getBaseUrl();
  const showTestWarning = stripeMode === "test" && !isLocalhost(baseUrl);

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isLive
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {isLive ? "LIVE" : "TEST"}
          </span>
        </div>
        <LogoutButton />
      </div>

      {showTestWarning && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
          <strong>Test mode:</strong> You are running Paytapper in Stripe TEST
          mode on a non-localhost URL. Do not share this link with real users.
        </div>
      )}

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="font-semibold">Client info</h2>
        <p>
          <strong>Client ID:</strong> {params.clientId}
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
      </section>

      <section className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Stripe</h2>
        <StartOnboardingButton clientId={params.clientId} />
        {client?.stripe?.accountId && (
          <div className="pt-2">
            <OpenStripeDashboardButton />
          </div>
        )}
      </section>

      <section className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Payments</h2>
          <DownloadPaymentsCsvButton clientId={params.clientId} />
        </div>

        <p>
          <strong>Total payments:</strong> {summary.totalCount}
        </p>

        <p>
          <strong>Total gross:</strong> €{formatEur(summary.totalGrossCents)}
        </p>

        <p>
          <strong>Total net:</strong> €{formatEur(summary.totalNetCents)}
        </p>

        {summary.lastPaymentAt && (
          <p className="text-sm text-gray-500">
            Last payment:{" "}
            {new Date(summary.lastPaymentAt).toLocaleString()}
          </p>
        )}
      </section>

      <section className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Recent payments</h2>

        {recentPayments.length === 0 && (
          <p className="text-sm text-gray-500">
            No payments yet.
          </p>
        )}

        {recentPayments.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between text-sm border-b last:border-b-0 py-1"
          >
            <div>
              <div className="font-medium">
                €{formatEur(p.amountCents)}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(paymentDateIso(p)).toLocaleString()}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {p.status}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

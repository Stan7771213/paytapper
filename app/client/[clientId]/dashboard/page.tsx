import { getClientById } from "@/lib/clientStore";
import { StartOnboardingButton } from "./start-onboarding-button";
import { OpenStripeDashboardButton } from "./open-stripe-dashboard-button";
import QRCode from "react-qr-code";
import { DownloadQrPngButton } from "./download-qr-png-button";

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

export default async function ClientDashboardPage({
  params,
  searchParams,
}: DashboardPageProps) {
  const { clientId } = await params;
  const search = (searchParams ? await searchParams : {}) ?? {};
  const onboardingParam = search.onboarding as string | string[] | undefined;

  const client = await getClientById(clientId);

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

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="font-semibold">Tips overview</h2>
        <p className="text-sm text-gray-600">Tip history will appear here later.</p>
      </section>
    </main>
  );
}

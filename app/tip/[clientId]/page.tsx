import { getClientById } from "@/lib/clientStore";
import { stripeMode } from "@/lib/stripe";
import TipClient from "../TipClient";
import type { Client } from "@/lib/types";

type TipPageProps = {
  params: Promise<{ clientId: string }>;
};

export default async function Page({ params }: TipPageProps) {
  const { clientId } = await params;

  const client = await getClientById(clientId);

  const branding: Client["branding"] | undefined = client?.branding;
  const title =
    branding?.title ?? client?.displayName ?? "Paytapper";
  const description = branding?.description;
  const avatarUrl = branding?.avatarUrl;

  const isTestMode = stripeMode === "test";

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white">
      <div className="max-w-xl mx-auto px-4 pt-6 space-y-4 text-center">
        {isTestMode && (
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold">
            Test payments
          </div>
        )}

        {avatarUrl && (
          <div className="flex justify-center">
            <img
              src={avatarUrl}
              alt={`${title} avatar`}
              className="h-20 w-20 rounded-full border border-gray-800 object-cover"
            />
          </div>
        )}

        <h1 className="text-3xl font-bold">{title}</h1>

        {description && (
          <p className="text-sm text-gray-400">{description}</p>
        )}
      </div>

      <TipClient clientId={clientId} />
    </main>
  );
}

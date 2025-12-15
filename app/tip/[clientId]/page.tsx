import { getClientById } from "@/lib/clientStore";
import TipClient from "../TipClient";
import type { Client } from "@/lib/types";

type TipPageProps = {
  params: Promise<{ clientId: string }>;
};

export default async function Page({ params }: TipPageProps) {
  const { clientId } = await params;

  const client = await getClientById(clientId);

  const branding: Client["branding"] | undefined = client?.branding;
  const displayName = client?.branding?.title ?? client?.displayName ?? undefined;

  const stripeMode = process.env.STRIPE_MODE === "live" ? "live" : "test";
  const isTestMode = stripeMode === "test";

  return (
    <main className="min-h-screen">
      <div className="max-w-xl mx-auto px-4 pt-4">
        {isTestMode ? (
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold">
            Test payments
          </div>
        ) : null}
      </div>

      <TipClient clientId={clientId} displayName={displayName} branding={branding} />
    </main>
  );
}

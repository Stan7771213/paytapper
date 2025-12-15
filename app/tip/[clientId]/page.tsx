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

  return <TipClient clientId={clientId} displayName={displayName} branding={branding} />;
}

import TipClient from "../TipClient";

type TipPageProps = {
  params: Promise<{ clientId: string }>;
};

export default async function Page({ params }: TipPageProps) {
  const { clientId } = await params;
  return <TipClient clientId={clientId} />;
}

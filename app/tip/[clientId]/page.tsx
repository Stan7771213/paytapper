import TipClient from "../TipClient";

export default async function Page(props: any) {
  const params = await props.params;
  return <TipClient clientId={params.clientId} />;
}


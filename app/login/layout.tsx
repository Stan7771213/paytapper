import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session) {
    redirect(`/client/${session.clientId}/dashboard`);
  }

  return children;
}

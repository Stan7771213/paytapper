import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/sessions";
import { getClientById } from "@/lib/clientStore";

export const dynamic = "force-dynamic";

export default async function PostAuthPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const client = await getClientById(session.clientId);

  if (!client || !client.dashboardToken) {
    throw new Error("Missing dashboard URL");
  }

  redirect(
    `/client/${client.id}/dashboard?token=${client.dashboardToken}`
  );
}

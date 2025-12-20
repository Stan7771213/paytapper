import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PostAuthPage() {
  const session = await getSession();

  // IMPORTANT:
  // Do NOT redirect if session is not yet available.
  // This page acts as a stabilization buffer for cookie propagation.
  if (!session) {
    return null;
  }

  redirect(`/client/${session.clientId}/dashboard`);
}

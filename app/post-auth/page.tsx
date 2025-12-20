import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PostAuthPage() {
  const session = await getSession();

  // v1 rule: no silent waiting, no null renders
  if (!session) {
    redirect("/register");
  }

  redirect(`/client/${session.clientId}/dashboard`);
}

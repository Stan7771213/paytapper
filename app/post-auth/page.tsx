import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/sessions";

export const dynamic = "force-dynamic";

export default async function PostAuthPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  redirect(`/client/${session.clientId}/dashboard`);
}

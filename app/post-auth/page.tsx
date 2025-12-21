import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PostAuthPage() {
  const session = await getSession();

  // Critical: allow render while cookie propagates
  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Finalizing login…
      </main>
    );
  }

  redirect(`/client/${session.clientId}/dashboard`);
}

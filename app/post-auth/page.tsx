import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PostAuthPage() {
  const session = await getSession();

  if (!session) {
    // ❗️ВАЖНО: НЕ null, а ЧЁТКИЙ ВЫХОД
    redirect("/");
  }

  redirect(`/client/${session.clientId}/dashboard`);
}

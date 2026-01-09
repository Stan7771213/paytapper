import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/sessions";
import { updateClient } from "@/lib/clientStore";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const displayName =
    typeof body?.displayName === "string"
      ? body.displayName.trim()
      : "";

  if (!displayName || displayName.length < 2 || displayName.length > 50) {
    return NextResponse.json(
      { error: "Invalid display name" },
      { status: 400 }
    );
  }

  await updateClient(session.clientId, { displayName });

  return NextResponse.json({ ok: true });
}

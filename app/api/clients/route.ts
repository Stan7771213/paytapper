import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { createClient } from "@/lib/clientStore";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const displayName = String(body.displayName ?? "").trim();
    const email =
      typeof body.email === "string" && body.email.trim()
        ? body.email.trim().toLowerCase()
        : undefined;

    const payoutMode =
      body.payoutMode === "platform" ? "platform" : "direct";

    if (!displayName) {
      return NextResponse.json(
        { error: "Missing displayName" },
        { status: 400 }
      );
    }

    const client = await createClient({
      displayName,
      email,
      payoutMode,
      ownerUserId: session.userAuthId,
    });

    return NextResponse.json(
      {
        clientId: client.id,
      },
      { status: 201 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

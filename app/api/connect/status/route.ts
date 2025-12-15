import { NextRequest, NextResponse } from "next/server";
import { getClientById } from "@/lib/clientStore";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get("clientId") ?? "";

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    const client = await getClientById(clientId);

    const stripeAccountId = client?.stripe?.accountId ?? null;

    if (!stripeAccountId) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    return NextResponse.json(
      {
        connected: true,
        stripeAccountId,
        email: client?.email ?? null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in /api/connect/status:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

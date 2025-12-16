import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getClientById, updateClient } from "@/lib/clientStore";

type OnboardRequest = {
  clientId: string;
};

function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit && explicit.trim()) return explicit.trim();

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim()) {
    const v = vercelUrl.trim();
    return v.startsWith("http") ? v : `https://${v}`;
  }

  // Local default
  return "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<OnboardRequest>;
    const clientId = body.clientId?.trim();
    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    const client = await getClientById(clientId);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    let accountId = client.stripe?.accountId?.trim();

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: client.email ?? undefined,
        metadata: {
          clientId,
        },
      });

      accountId = account.id;

      await updateClient(clientId, {
        stripe: { accountId },
      });
    }

    const baseUrl = getBaseUrl();
    const returnUrl = `${baseUrl}/client/${clientId}/dashboard`;
    const refreshUrl = `${baseUrl}/client/${clientId}/dashboard`;

    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      return_url: returnUrl,
      refresh_url: refreshUrl,
    });

    return NextResponse.json({ url: link.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Keep GET explicit (no accidental onboarding by browser navigation)
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

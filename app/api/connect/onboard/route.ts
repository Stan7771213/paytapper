import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getClientById } from "@/lib/clientStore";

type OnboardRequest = {
  clientId: string;
};

type OnboardResponse = {
  url: string;
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit && explicit.trim()) return explicit.trim();

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim()) {
    const v = vercelUrl.trim();
    return v.startsWith("http") ? v : `https://${v}`;
  }

  return "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<OnboardRequest>;
    const clientId = body.clientId?.trim();

    if (!clientId) {
      return json({ error: "clientId is required" }, 400);
    }

    const client = await getClientById(clientId);
    if (!client) {
      return json({ error: "Client not found" }, 404);
    }

    const accountId = client.stripe?.accountId?.trim();
    if (!accountId) {
      // Architecture: /connect/create must run first (idempotent ensure).
      return json({ error: "Stripe account not created yet" }, 409);
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

    const payload: OnboardResponse = { url: link.url };
    return json(payload, 200);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return json({ error: message }, 500);
  }
}

// Keep GET explicit (no accidental onboarding by browser navigation)
export async function GET() {
  return json({ error: "Method Not Allowed" }, 405);
}

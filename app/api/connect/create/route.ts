import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getClientById, updateClient } from "@/lib/clientStore";

type CreateRequest = {
  clientId: string;
};

type CreateResponse = {
  accountId: string;
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<CreateRequest>;
    const clientId = body.clientId?.trim();

    if (!clientId) {
      return json({ error: "clientId is required" }, 400);
    }

    const client = await getClientById(clientId);
    if (!client) {
      return json({ error: "Client not found" }, 404);
    }

    const existing = client.stripe?.accountId?.trim();
    if (existing) {
      const payload: CreateResponse = { accountId: existing };
      return json(payload, 200);
    }

    const account = await stripe.accounts.create({
      type: "express",
      email: client.email ?? undefined,
      metadata: { clientId },
    });

    const accountId = account.id;

    // Persist once; never overwrite if already set (guarded above).
    await updateClient(clientId, {
      stripe: { accountId },
    });

    const payload: CreateResponse = { accountId };
    return json(payload, 200);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return json({ error: message }, 500);
  }
}

// Keep non-POST methods explicit.
export async function GET() {
  return json({ error: "Method Not Allowed" }, 405);
}

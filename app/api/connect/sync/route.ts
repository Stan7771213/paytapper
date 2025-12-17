import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getClientById, updateClient } from "@/lib/clientStore";
import { sendStripeConnectedEmail } from "@/lib/email";
import {
  deriveStripeConnectState,
  extractConnectSignals,
  type StripeConnectSignals,
  type StripeConnectState,
} from "@/lib/stripeConnect";

export const runtime = "nodejs";

type ConnectSyncResponse = {
  state: StripeConnectState;
  connected: boolean;
  accountId: string;

  chargesEnabled: boolean;
  detailsSubmitted: boolean;

  signals: StripeConnectSignals;
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit && explicit.trim()) return explicit.trim().replace(/\/+$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim()) {
    const v = vercelUrl.trim().replace(/\/+$/, "");
    return v.startsWith("http") ? v : `https://${v}`;
  }

  return "http://localhost:3000";
}

async function maybeSendStripeConnectedEmail(params: {
  clientId: string;
  clientEmail?: string;
  payoutMode: "direct" | "platform";
  alreadySentAt?: string;
  state: StripeConnectState;
}) {
  const { clientId, clientEmail, payoutMode, alreadySentAt, state } = params;

  // Only direct payout mode requires Connect readiness.
  if (payoutMode !== "direct") return;

  if (state !== "active") return;
  if (!clientEmail || !clientEmail.trim()) return;
  if (alreadySentAt && alreadySentAt.trim()) return;

  const baseUrl = getBaseUrl();
  const tipUrl = `${baseUrl}/tip/${encodeURIComponent(clientId)}`;

  const result = await sendStripeConnectedEmail({
    email: clientEmail.trim(),
    clientId,
    tipUrl,
  });

  if (!result.success) {
    console.warn("[connect-sync] stripeConnectedEmail not sent", {
      clientId,
      mode: result.mode,
      message: result.message,
    });
    return;
  }

  await updateClient(clientId, {
    emailEvents: { stripeConnectedSentAt: new Date().toISOString() },
  });

  console.info("[connect-sync] stripeConnectedEmail sent", { clientId });
}

type Body = { clientId?: unknown };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const clientId =
      typeof body.clientId === "string" ? body.clientId.trim() : "";

    if (!clientId) {
      return json({ error: "Missing clientId" }, 400);
    }

    const client = await getClientById(clientId);
    if (!client) {
      return json({ error: "Client not found" }, 404);
    }

    const accountId = client.stripe?.accountId?.trim() ?? "";

    if (!accountId) {
      const signals = extractConnectSignals(undefined, null);
      const state = deriveStripeConnectState(signals);

      const payload: ConnectSyncResponse = {
        state,
        connected: false,
        accountId: "",
        chargesEnabled: false,
        detailsSubmitted: false,
        signals,
      };

      return json(payload, 200);
    }

    const acct = await stripe.accounts.retrieve(accountId);

    const signals = extractConnectSignals(accountId, acct);
    const state = deriveStripeConnectState(signals);

    const chargesEnabled = Boolean(acct.charges_enabled);
    const detailsSubmitted = Boolean(acct.details_submitted);
    const connected = state === "active";

    await maybeSendStripeConnectedEmail({
      clientId,
      clientEmail: client.email,
      payoutMode: client.payoutMode,
      alreadySentAt: client.emailEvents?.stripeConnectedSentAt,
      state,
    });

    const payload: ConnectSyncResponse = {
      state,
      connected,
      accountId,
      chargesEnabled,
      detailsSubmitted,
      signals,
    };

    return json(payload, 200);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return json({ error: message }, 500);
  }
}

export async function GET() {
  return json({ error: "Method Not Allowed" }, 405);
}

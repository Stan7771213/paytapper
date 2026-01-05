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

type ConnectStatusResponse = {
  state: StripeConnectState;
  connected: boolean;
  accountId: string;

  chargesEnabled: boolean;
  detailsSubmitted: boolean;

  // extra signals for UI/debugging (counts only, no arrays)
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

  // Only relevant for direct payouts; platform mode does not require Connect to accept payments.
  if (payoutMode !== "direct") return;

  // Must be active, must have email, must not have sent already.
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

  // Idempotency: only stamp when email was actually sent successfully.
  if (result.success) {
    await updateClient(clientId, {
      emailEvents: { stripeConnectedSentAt: new Date().toISOString() },
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId")?.trim();

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

      // No accountId => cannot be active, so no email trigger here.
      const payload: ConnectStatusResponse = {
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

    // Side-effect (idempotent): send "Stripe connected + QR" once on first observed active state.
    // IMPORTANT: we do NOT persist connection flags, only the email event timestamp.
    await maybeSendStripeConnectedEmail({
      clientId,
      clientEmail: client.email,
      payoutMode: client.payoutMode,
      alreadySentAt: client.emailEvents?.stripeConnectedSentAt,
      state,
    });

    const payload: ConnectStatusResponse = {
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

// Keep non-GET methods explicit.
export async function POST() {
  return json({ error: "Method Not Allowed" }, 405);
}

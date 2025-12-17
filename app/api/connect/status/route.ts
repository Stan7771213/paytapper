import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getClientById } from "@/lib/clientStore";
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

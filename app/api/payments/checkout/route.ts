import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getClientById } from "@/lib/clientStore";
import { PLATFORM_FEE_PERCENT } from "@/lib/types";

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

type CheckoutBody = {
  clientId?: unknown;
  amountCents?: unknown;
};

function isPositiveInt(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value > 0
  );
}

function calcPlatformFeeCents(amountCents: number): number {
  // Integer cents, deterministic.
  return Math.round((amountCents * PLATFORM_FEE_PERCENT) / 100);
}

type ConnectEligibility = {
  shouldRouteToConnect: boolean;
  destinationAccountId?: string;
};

async function resolveConnectEligibility(clientId: string): Promise<ConnectEligibility> {
  const client = await getClientById(clientId);
  if (!client) {
    throw new Error("Client not found");
  }

  const payoutMode = client.payoutMode;
  const accountId = client.stripe?.accountId?.trim();

  if (payoutMode !== "direct" || !accountId) {
    return { shouldRouteToConnect: false };
  }

  // Derive "connected" from Stripe (do not store flags in JSON).
  const acct = await stripe.accounts.retrieve(accountId);
  const chargesEnabled = Boolean(acct.charges_enabled);
  const detailsSubmitted = Boolean(acct.details_submitted);

  const connected = chargesEnabled && detailsSubmitted;
  if (!connected) {
    return { shouldRouteToConnect: false, destinationAccountId: accountId };
  }

  return { shouldRouteToConnect: true, destinationAccountId: accountId };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody;

    const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    if (!isPositiveInt(body.amountCents)) {
      return NextResponse.json(
        { error: "amountCents must be a positive integer" },
        { status: 400 }
      );
    }

    const amountCents = body.amountCents;
    const baseUrl = getBaseUrl();

    let eligibility: ConnectEligibility;
    try {
      eligibility = await resolveConnectEligibility(clientId);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      if (message === "Client not found") {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Unable to resolve Stripe Connect status", details: message },
        { status: 500 }
      );
    }

    const platformFeeCents = calcPlatformFeeCents(amountCents);

    const paymentIntentData: {
      metadata: { clientId: string };
      application_fee_amount?: number;
      transfer_data?: { destination: string };
    } = {
      // Webhook uses PaymentIntent metadata. Keep it minimal and non-placeholder.
      metadata: { clientId },
    };

    if (eligibility.shouldRouteToConnect && eligibility.destinationAccountId) {
      paymentIntentData.application_fee_amount = platformFeeCents;
      paymentIntentData.transfer_data = { destination: eligibility.destinationAccountId };
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: "Paytapper payment" },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`,
      payment_intent_data: paymentIntentData,
    });

    return NextResponse.json({
      checkoutSessionId: session.id,
      url: session.url,
      routing: {
        mode: eligibility.shouldRouteToConnect ? "connect" : "platform",
        destinationAccountId: eligibility.shouldRouteToConnect
          ? eligibility.destinationAccountId ?? null
          : null,
      },
    });
  } catch (err) {
    const details = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Unable to create checkout session", details },
      { status: 500 }
    );
  }
}

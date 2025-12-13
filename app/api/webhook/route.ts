import { NextResponse } from "next/server";
import Stripe from "stripe";
import { addPayment } from "@/lib/paymentStore";
import { stripe, stripeMode } from "@/lib/stripe";

// Platform fee (10%)
const PLATFORM_FEE_PERCENT = 0.1;

function getWebhookSecret(): string {
  if (stripeMode === "live") {
    const secret =
      process.env.STRIPE_WEBHOOK_SECRET_LIVE ||
      process.env.STRIPE_WEBHOOK_SECRET;

    if (!secret) {
      throw new Error(
        "Stripe LIVE webhook secret is not set (STRIPE_WEBHOOK_SECRET_LIVE)"
      );
    }
    return secret;
  } else {
    const secret =
      process.env.STRIPE_WEBHOOK_SECRET_TEST ||
      process.env.STRIPE_WEBHOOK_SECRET;

    if (!secret) {
      throw new Error(
        "Stripe TEST webhook secret is not set (STRIPE_WEBHOOK_SECRET_TEST)"
      );
    }
    return secret;
  }
}

const webhookSecret = getWebhookSecret();

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    if (!signature) {
      return new NextResponse("Missing Stripe signature", { status: 400 });
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err: any) {
    console.error("❌ Stripe signature error:", err.message);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (event.type !== "payment_intent.succeeded") {
    return NextResponse.json({ received: true });
  }

  const intent = event.data.object as Stripe.PaymentIntent;

  const clientId = intent.metadata?.clientId;
  if (!clientId) {
    console.warn("⚠️ payment_intent without clientId, skipping");
    return NextResponse.json({ received: true, skipped: true });
  }

  const grossAmount = intent.amount_received ?? intent.amount ?? 0;
  const currency = (intent.currency || "eur").toLowerCase();

  const platformFeeAmount = Math.round(
    grossAmount * PLATFORM_FEE_PERCENT
  );
  const clientAmount = grossAmount - platformFeeAmount;

  try {
    await addPayment({
  clientId,
  amountCents: grossAmount,
  currency,
  platformFeeCents: platformFeeAmount,
  clientAmountCents: clientAmount,
  status: "succeeded",
  type: "tip",
  stripePaymentIntentId: intent.id,
  createdAt: new Date().toISOString(),
  raw: {
    eventType: event.type,
    paymentIntentId: intent.id,
    checkoutSessionId: (intent.metadata as any)?.checkoutSessionId ?? null,
    metadata: intent.metadata ?? null,
  },
});

  } catch (error) {
    console.error("❌ Failed to store payment:", error);
    return new NextResponse("Failed to store payment", { status: 500 });
  }

  return NextResponse.json({ received: true });
}


import { NextResponse } from "next/server";
import Stripe from "stripe";

import { stripe, stripeMode } from "@/lib/stripe";
import { PLATFORM_FEE_PERCENT } from "@/lib/types";
import { upsertPaymentByPaymentIntentId } from "@/lib/paymentStore";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error("Missing required environment variable: " + name);
  }
  return value;
}

function getWebhookSecret(): string {
  return stripeMode === "live"
    ? requireEnv("STRIPE_WEBHOOK_SECRET_LIVE")
    : requireEnv("STRIPE_WEBHOOK_SECRET_TEST");
}

const webhookSecret = getWebhookSecret();

async function resolveCheckoutSession(
  paymentIntentId: string
): Promise<Stripe.Checkout.Session> {
  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntentId,
    limit: 1,
  });

  const session = sessions.data[0];
  if (!session?.id) {
    throw new Error(
      "Unable to resolve checkout session for paymentIntentId=" +
        paymentIntentId
    );
  }
  return session;
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!signature) {
    console.error("❌ Missing stripe-signature header");
    return new NextResponse("Missing Stripe signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("❌ Stripe constructEvent FAILED");
    console.error("❌ Error:", err);
    console.error("❌ Signature header:", signature);
    console.error("❌JSON.stringify body length:", body.length);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (event.type !== "payment_intent.succeeded") {
    return NextResponse.json({ received: true });
  }

  const intent = event.data.object as Stripe.PaymentIntent;
  const paymentIntentId = intent.id;

  let session: Stripe.Checkout.Session;
  try {
    session = await resolveCheckoutSession(paymentIntentId);
  } catch (e) {
    console.error("❌ checkoutSession resolve failed", e);
    return new NextResponse("checkoutSession not found", { status: 500 });
  }

  const checkoutSessionId = session.id;
  const clientId = intent.metadata?.clientId || session.metadata?.clientId;

  if (!clientId) {
    console.warn("⚠️ Missing clientId, skipping payment");
    return NextResponse.json({ received: true, skipped: true });
  }

  const grossAmount = intent.amount_received ?? intent.amount ?? 0;
  const platformFeeCents = Math.round(
    grossAmount * (PLATFORM_FEE_PERCENT / 100)
  );
  const netAmountCents = grossAmount - platformFeeCents;

  try {
    await upsertPaymentByPaymentIntentId(paymentIntentId, {
      clientId,
      amountCents: grossAmount,
      currency: "eur",
      platformFeeCents,
      netAmountCents,
      status: "paid",
      paidAt: new Date().toISOString(),
      stripe: {
        paymentIntentId,
        checkoutSessionId,
      },
    });
  } catch (error) {
    console.error("❌ Failed to store payment:", error);
    return new NextResponse("Failed to store payment", { status: 500 });
  }

  return NextResponse.json({ received: true });
}

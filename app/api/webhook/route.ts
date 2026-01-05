// TEMP DISABLED STRIPE WEBHOOK
import { NextResponse } from "next/server";
// TEMP DISABLED STRIPE WEBHOOK
import Stripe from "stripe";
// TEMP DISABLED STRIPE WEBHOOK

// TEMP DISABLED STRIPE WEBHOOK
import { stripe, stripeMode } from "@/lib/stripe";
// TEMP DISABLED STRIPE WEBHOOK
import { PLATFORM_FEE_PERCENT } from "@/lib/types";
// TEMP DISABLED STRIPE WEBHOOK
import { upsertPaymentByPaymentIntentId } from "@/lib/paymentStore";
// TEMP DISABLED STRIPE WEBHOOK

// TEMP DISABLED STRIPE WEBHOOK
function requireEnv(name: string): string {
// TEMP DISABLED STRIPE WEBHOOK
  const value = process.env[name];
// TEMP DISABLED STRIPE WEBHOOK
  if (!value) {
// TEMP DISABLED STRIPE WEBHOOK
    throw new Error("Missing required environment variable: " + name);
// TEMP DISABLED STRIPE WEBHOOK
  }
// TEMP DISABLED STRIPE WEBHOOK
  return value;
// TEMP DISABLED STRIPE WEBHOOK
}
// TEMP DISABLED STRIPE WEBHOOK

// TEMP DISABLED STRIPE WEBHOOK
function getWebhookSecret(): string {
// TEMP DISABLED STRIPE WEBHOOK
  return stripeMode === "live"
// TEMP DISABLED STRIPE WEBHOOK
    ? requireEnv("STRIPE_WEBHOOK_SECRET_LIVE")
// TEMP DISABLED STRIPE WEBHOOK
    : requireEnv("STRIPE_WEBHOOK_SECRET_TEST");
// TEMP DISABLED STRIPE WEBHOOK
}
// TEMP DISABLED STRIPE WEBHOOK

// TEMP DISABLED STRIPE WEBHOOK
const webhookSecret = getWebhookSecret();
// TEMP DISABLED STRIPE WEBHOOK

// TEMP DISABLED STRIPE WEBHOOK
async function resolveCheckoutSession(
// TEMP DISABLED STRIPE WEBHOOK
  paymentIntentId: string
// TEMP DISABLED STRIPE WEBHOOK
): Promise<Stripe.Checkout.Session> {
// TEMP DISABLED STRIPE WEBHOOK
  const sessions = await stripe.checkout.sessions.list({
// TEMP DISABLED STRIPE WEBHOOK
    payment_intent: paymentIntentId,
// TEMP DISABLED STRIPE WEBHOOK
    limit: 1,
// TEMP DISABLED STRIPE WEBHOOK
  });
// TEMP DISABLED STRIPE WEBHOOK

// TEMP DISABLED STRIPE WEBHOOK
  const session = sessions.data[0];
// TEMP DISABLED STRIPE WEBHOOK
  if (!session?.id) {
// TEMP DISABLED STRIPE WEBHOOK
    throw new Error(
// TEMP DISABLED STRIPE WEBHOOK
      "Unable to resolve checkout session for paymentIntentId=" +
// TEMP DISABLED STRIPE WEBHOOK
        paymentIntentId
// TEMP DISABLED STRIPE WEBHOOK
    );
// TEMP DISABLED STRIPE WEBHOOK
  }
// TEMP DISABLED STRIPE WEBHOOK
  return session;
// TEMP DISABLED STRIPE WEBHOOK
}
// TEMP DISABLED STRIPE WEBHOOK

// TEMP DISABLED STRIPE WEBHOOK
export async function POST(req: Request) {
// TEMP DISABLED STRIPE WEBHOOK
  const signature = req.headers.get("stripe-signature");
// TEMP DISABLED STRIPE WEBHOOK
  const body = await req.text();
// TEMP DISABLED STRIPE WEBHOOK

// TEMP DISABLED STRIPE WEBHOOK
  if (!signature) {
// TEMP DISABLED STRIPE WEBHOOK
    return new NextResponse("Missing Stripe signature", { status: 400 });
// TEMP DISABLED STRIPE WEBHOOK
  }
// TEMP DISABLED STRIPE WEBHOOK

// TEMP DISABLED STRIPE WEBHOOK
  let event: Stripe.Event;
// TEMP DISABLED STRIPE WEBHOOK

// TEMP DISABLED STRIPE WEBHOOK
  try {
// TEMP DISABLED STRIPE WEBHOOK
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
// TEMP DISABLED STRIPE WEBHOOK
  } catch (err) {
// TEMP DISABLED STRIPE WEBHOOK
    const message = err instanceof Error ? err.message : "Invalid signature";
// TEMP DISABLED STRIPE WEBHOOK
    console.error("❌ Stripe signature error:", message);
// TEMP DISABLED STRIPE WEBHOOK
    return new NextResponse("Invalid signature", { status: 400 });
// TEMP DISABLED STRIPE WEBHOOK
  }
// TEMP DISABLED STRIPE WEBHOOK

// TEMP DISABLED STRIPE WEBHOOK
  if (event.type !== "payment_intent.succeeded") {
// TEMP DISABLED STRIPE WEBHOOK
    return NextResponse.json({ received: true });
// TEMP DISABLED STRIPE WEBHOOK
  }
// TEMP DISABLED STRIPE WEBHOOK

// TEMP DISABLED STRIPE WEBHOOK
  const intent = event.data.object as Stripe.PaymentIntent;
// TEMP DISABLED STRIPE WEBHOOK
  const paymentIntentId = intent.id;
// TEMP DISABLED STRIPE WEBHOOK

// TEMP DISABLED STRIPE WEBHOOK
  let session: Stripe.Checkout.Session;
// TEMP DISABLED STRIPE WEBHOOK
  try {
// TEMP DISABLED STRIPE WEBHOOK
    session = await resolveCheckoutSession(paymentIntentId);
// TEMP DISABLED STRIPE WEBHOOK
  } catch (e) {
// TEMP DISABLED STRIPE WEBHOOK
    console.error("❌", e);
// TEMP DISABLED STRIPE WEBHOOK
    return new NextResponse("checkoutSession not found", { status: 500 });
// TEMP DISABLED STRIPE WEBHOOK
  }
// TEMP DISABLED STRIPE WEBHOOK

// TEMP DISABLED STRIPE WEBHOOK
  const checkoutSessionId = session.id;
// TEMP DISABLED STRIPE WEBHOOK

// TEMP DISABLED STRIPE WEBHOOK
  const clientId = intent.metadata?.clientId || session.metadata?.clientId;
// TEMP DISABLED STRIPE WEBHOOK
  if (!clientId) {
// TEMP DISABLED STRIPE WEBHOOK
    console.warn("⚠️ Missing clientId, skipping");
// TEMP DISABLED STRIPE WEBHOOK
    return NextResponse.json({ received: true, skipped: true });
// TEMP DISABLED STRIPE WEBHOOK
  }
// TEMP DISABLED STRIPE WEBHOOK

// TEMP DISABLED STRIPE WEBHOOK
  const currency = intent.currency?.toLowerCase();
// TEMP DISABLED STRIPE WEBHOOK
  if (currency !== "eur") {
// TEMP DISABLED STRIPE WEBHOOK
    console.warn(`⚠️ Unsupported currency "${currency}", skipping`);
// TEMP DISABLED STRIPE WEBHOOK
    return NextResponse.json({ received: true, skipped: true });
// TEMP DISABLED STRIPE WEBHOOK
  }
// TEMP DISABLED STRIPE WEBHOOK

// TEMP DISABLED STRIPE WEBHOOK
  const grossAmount = intent.amount_received ?? intent.amount ?? 0;
// TEMP DISABLED STRIPE WEBHOOK
  const platformFeeCents = Math.round(
// TEMP DISABLED STRIPE WEBHOOK
    grossAmount * (PLATFORM_FEE_PERCENT / 100)
// TEMP DISABLED STRIPE WEBHOOK
  );
// TEMP DISABLED STRIPE WEBHOOK
  const netAmountCents = grossAmount - platformFeeCents;
// TEMP DISABLED STRIPE WEBHOOK

// TEMP DISABLED STRIPE WEBHOOK
  try {
// TEMP DISABLED STRIPE WEBHOOK
    await upsertPaymentByPaymentIntentId(paymentIntentId, {
// TEMP DISABLED STRIPE WEBHOOK
      clientId,
// TEMP DISABLED STRIPE WEBHOOK
      amountCents: grossAmount,
// TEMP DISABLED STRIPE WEBHOOK
      currency: "eur",
// TEMP DISABLED STRIPE WEBHOOK
      platformFeeCents,
// TEMP DISABLED STRIPE WEBHOOK
      netAmountCents,
// TEMP DISABLED STRIPE WEBHOOK
      status: "paid",
// TEMP DISABLED STRIPE WEBHOOK
      paidAt: new Date().toISOString(),
// TEMP DISABLED STRIPE WEBHOOK
      stripe: {
// TEMP DISABLED STRIPE WEBHOOK
        paymentIntentId,
// TEMP DISABLED STRIPE WEBHOOK
        checkoutSessionId,
// TEMP DISABLED STRIPE WEBHOOK
      },
// TEMP DISABLED STRIPE WEBHOOK
    });
// TEMP DISABLED STRIPE WEBHOOK
  } catch (error) {
// TEMP DISABLED STRIPE WEBHOOK
    console.error("❌ Failed to store payment:", error);
// TEMP DISABLED STRIPE WEBHOOK
    return new NextResponse("Failed to store payment", { status: 500 });
// TEMP DISABLED STRIPE WEBHOOK
  }
// TEMP DISABLED STRIPE WEBHOOK

// TEMP DISABLED STRIPE WEBHOOK
  return NextResponse.json({ received: true });
// TEMP DISABLED STRIPE WEBHOOK
}

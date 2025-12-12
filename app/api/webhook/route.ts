import { NextResponse } from "next/server";
import Stripe from "stripe";
import { addPayment } from "@/lib/paymentStore";
import { stripe, stripeMode } from "@/lib/stripe";

// Platform fee (10%)
const PLATFORM_FEE_PERCENT = 0.1;

function getWebhookSecret(): string {
  if (stripeMode === "live") {
    const liveSecret =
      process.env.STRIPE_WEBHOOK_SECRET_LIVE ||
      process.env.STRIPE_WEBHOOK_SECRET;
    if (!liveSecret) {
      throw new Error(
        "Stripe live webhook secret is not set. Please configure STRIPE_WEBHOOK_SECRET_LIVE or STRIPE_WEBHOOK_SECRET."
      );
    }
    return liveSecret;
  } else {
    const testSecret =
      process.env.STRIPE_WEBHOOK_SECRET_TEST ||
      process.env.STRIPE_WEBHOOK_SECRET;
    if (!testSecret) {
      throw new Error(
        "Stripe test webhook secret is not set. Please configure STRIPE_WEBHOOK_SECRET_TEST or STRIPE_WEBHOOK_SECRET."
      );
    }
    return testSecret;
  }
}

const webhookSecret = getWebhookSecret();

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    if (!sig) {
      console.error("Missing Stripe signature header");
      return new NextResponse("Missing signature", { status: 400 });
    }

    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return new NextResponse("Signature error", { status: 400 });
  }

  // Handle payment success
  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;

    const clientId = intent.metadata?.clientId;
    if (!clientId) {
      console.error("payment_intent.succeeded without clientId in metadata");
      return NextResponse.json({ received: true, skipped: true });
    }

    const grossAmount = intent.amount_received ?? intent.amount ?? 0;
    const currency = (intent.currency || "eur").toLowerCase();

    const platformFeeAmount = Math.round(grossAmount * PLATFORM_FEE_PERCENT);
    const clientAmount = grossAmount - platformFeeAmount;

    try {
      await addPayment({
        stripePaymentIntentId: intent.id,
        stripeCheckoutSessionId:
          (intent.metadata as any)?.checkoutSessionId ?? null,
        clientId,
        amountTotal: grossAmount,
        currency,
        platformFeeAmount,
        clientAmount,
        status: "succeeded",
        type: "tip",
      });
    } catch (error) {
      console.error("Failed to store payment:", error);
      return new NextResponse("Failed to store payment", { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}


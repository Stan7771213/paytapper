import { NextResponse } from "next/server";
import Stripe from "stripe";
import { addPayment } from "@/lib/paymentStore";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

// Platform fee (10%)
const PLATFORM_FEE_PERCENT = 0.10;

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    if (!sig) {
      console.error("Missing Stripe signature header");
      return new NextResponse("Missing signature", { status: 400 });
    }

    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
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
        id: intent.id,
        stripePaymentIntentId: intent.id,
        stripeCheckoutSessionId:
          (intent.metadata as any)?.checkoutSessionId ?? null,
        clientId,
        amountTotal: grossAmount,
        currency,
        platformFeeAmount,
        clientAmount,
        status: "succeeded",

        // 🔥 NEW FIELD
        type: "tip",
      });
    } catch (error) {
      console.error("Failed to store payment:", error);
      return new NextResponse("Failed to store payment", { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}


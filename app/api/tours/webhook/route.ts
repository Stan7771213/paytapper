import { NextResponse } from "next/server";
import Stripe from "stripe";

import { toursStripe } from "@/lib/tours/stripe";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error("Missing required environment variable: " + name);
  }
  return value.trim();
}

const toursWebhookSecret = requireEnv("TOURS_STRIPE_WEBHOOK_SECRET_TEST");

export const runtime = "nodejs";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!signature) {
    console.error("❌ Missing stripe-signature header on tours webhook");
    return new NextResponse("Missing Stripe signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = toursStripe.webhooks.constructEvent(
      body,
      signature,
      toursWebhookSecret
    );
  } catch (err) {
    console.error("❌ Tours Stripe constructEvent FAILED");
    console.error("❌ Error:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (event.type !== "payment_intent.succeeded") {
    return NextResponse.json({ received: true, ignored: true });
  }

  const intent = event.data.object as Stripe.PaymentIntent;
  const metadata = intent.metadata ?? {};
  const paymentDomain = metadata.paymentDomain ?? "";

  if (paymentDomain !== "tours") {
    return NextResponse.json({ received: true, skipped: true });
  }

  const payload = {
    paymentIntentId: intent.id,
    amountReceived: intent.amount_received ?? intent.amount ?? 0,
    currency: intent.currency ?? "eur",
    status: intent.status,
    metadata: {
      paymentDomain,
      tourProductId: metadata.tourProductId ?? "",
      tourDate: metadata.tourDate ?? "",
      tourTime: metadata.tourTime ?? "",
      customerName: metadata.customerName ?? "",
      customerEmail: metadata.customerEmail ?? "",
      customerPhone: metadata.customerPhone ?? "",
      adults: metadata.adults ?? "",
      children: metadata.children ?? "",
      freeChildren: metadata.freeChildren ?? "",
      extraPaidChildren: metadata.extraPaidChildren ?? "",
      payableGuests: metadata.payableGuests ?? "",
      totalGuests: metadata.totalGuests ?? "",
    },
    receivedAt: new Date().toISOString(),
  };

  console.log("✅ TOURS_PAYMENT_CONFIRMED", JSON.stringify(payload));

  return NextResponse.json({ received: true, toursPaymentConfirmed: true });
}

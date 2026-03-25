import { NextResponse } from "next/server";
import Stripe from "stripe";

import { toursStripe } from "@/lib/tours/stripe";
import { getTourProductById } from "@/lib/tours/config";
import { upsertTourBookingByPaymentIntentId } from "@/lib/tours/bookingStore";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error("Missing required environment variable: " + name);
  }
  return value.trim();
}

const toursWebhookSecret = requireEnv("TOURS_STRIPE_WEBHOOK_SECRET_TEST");

export const runtime = "nodejs";

async function resolveCheckoutSession(
  paymentIntentId: string
): Promise<Stripe.Checkout.Session> {
  const sessions = await toursStripe.checkout.sessions.list({
    payment_intent: paymentIntentId,
    limit: 1,
  });

  const session = sessions.data[0];
  if (!session?.id) {
    throw new Error(
      "Unable to resolve checkout session for paymentIntentId=" + paymentIntentId
    );
  }
  return session;
}

function toInt(value: string | undefined): number {
  const n = Number(value ?? "");
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

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

  let session: Stripe.Checkout.Session;
  try {
    session = await resolveCheckoutSession(intent.id);
  } catch (error) {
    console.error("❌ Failed to resolve tours checkout session", error);
    return new NextResponse("checkoutSession not found", { status: 500 });
  }

  const productId = metadata.tourProductId ?? "";
  const product = getTourProductById(productId);

  if (!product) {
    console.error("❌ Unknown tour product in webhook metadata:", productId);
    return new NextResponse("Unknown tour product", { status: 400 });
  }

  const bookingPayload = {
    productId: product.id,
    productTitle: product.title,
    date: metadata.tourDate ?? "",
    time: metadata.tourTime ?? "",
    adults: toInt(metadata.adults),
    children: toInt(metadata.children),
    freeChildren: toInt(metadata.freeChildren),
    extraPaidChildren: toInt(metadata.extraPaidChildren),
    payableGuests: toInt(metadata.payableGuests),
    totalGuests: toInt(metadata.totalGuests),
    amountCents: intent.amount_received ?? intent.amount ?? 0,
    currency: "eur" as const,
    status: "paid" as const,
    customer: {
      name: metadata.customerName ?? "",
      email: metadata.customerEmail ?? "",
      phone: metadata.customerPhone ?? "",
    },
    stripe: {
      paymentIntentId: intent.id,
      checkoutSessionId: session.id,
    },
    paidAt: new Date().toISOString(),
  };

  try {
    await upsertTourBookingByPaymentIntentId(intent.id, bookingPayload);
  } catch (error) {
    console.error("❌ Failed to store tour booking", error);
    return new NextResponse("Failed to store tour booking", { status: 500 });
  }

  console.log(
    "✅ TOURS_BOOKING_STORED",
    JSON.stringify({
      paymentIntentId: intent.id,
      checkoutSessionId: session.id,
      productId: bookingPayload.productId,
      date: bookingPayload.date,
      time: bookingPayload.time,
      totalGuests: bookingPayload.totalGuests,
      amountCents: bookingPayload.amountCents,
      customerEmail: bookingPayload.customer.email,
    })
  );

  return NextResponse.json({ received: true, toursBookingStored: true });
}

import Stripe from "stripe";
import { NextResponse } from "next/server";

import { sendTourBookingEmails } from "@/lib/tours/email";
import {
  getTourBookingByPaymentIntentId,
  upsertTourBookingByPaymentIntentId,
} from "@/lib/tours/bookingStore";
import { getTourProductById } from "@/lib/tours/config";
import { confirmOctoBooking } from "@/lib/tours/octo";
import { toursStripe } from "@/lib/tours/stripe";

export const runtime = "nodejs";

function getWebhookSecret(): string {
  const value = process.env.TOURS_STRIPE_WEBHOOK_SECRET;
  if (!value || !value.trim()) {
    throw new Error("Missing TOURS_STRIPE_WEBHOOK_SECRET");
  }
  return value.trim();
}

function toInt(value: string | undefined): number {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

async function resolveCheckoutSession(
  paymentIntentId: string
): Promise<Stripe.Checkout.Session> {
  const sessions = await toursStripe.checkout.sessions.list({
    payment_intent: paymentIntentId,
    limit: 1,
  });

  const session = sessions.data[0];
  if (!session) {
    throw new Error(`Checkout Session not found for paymentIntentId=${paymentIntentId}`);
  }

  return session;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = toursStripe.webhooks.constructEvent(
      rawBody,
      signature,
      getWebhookSecret()
    );
  } catch (error) {
    console.error("❌ Tours webhook signature verification failed", error);
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

  const customerName = metadata.customerName ?? "";

  let octoData:
    | {
        bookingUuid?: string;
        availabilityId?: string;
        status?: string;
        confirmedAt?: string;
        voucherDeliveryValue?: string;
        holdExpiresAt?: string;
      }
    | undefined;

  if (product.availabilityMode === "octo") {
    const octoBookingUuid = metadata.octoBookingUuid?.trim() ?? "";
    if (!octoBookingUuid) {
      console.error("❌ Missing octoBookingUuid in payment metadata");
      return new NextResponse("Missing octoBookingUuid", { status: 500 });
    }

    let octoConfirm;
    try {
      octoConfirm = await confirmOctoBooking({
        bookingUuid: octoBookingUuid,
        fullName: customerName,
        emailAddress: metadata.customerEmail ?? "",
        phoneNumber: metadata.customerPhone ?? "",
        country: "EE",
      });
    } catch (error) {
      console.error("❌ Failed to confirm OCTO booking", error);
      return new NextResponse("Failed to confirm OCTO booking", { status: 500 });
    }

    if (octoConfirm.status !== "CONFIRMED") {
      console.error(
        "❌ OCTO booking did not confirm",
        JSON.stringify({
          paymentIntentId: intent.id,
          octoBookingUuid,
          octoStatus: octoConfirm.status,
        })
      );
      return new NextResponse("OCTO booking not confirmed", { status: 500 });
    }

    octoData = {
      bookingUuid: octoBookingUuid,
      availabilityId: metadata.octoAvailabilityId ?? "",
      status: octoConfirm.status,
      confirmedAt: octoConfirm.utcConfirmedAt ?? "",
      voucherDeliveryValue: octoConfirm.voucherDeliveryValue ?? "",
      holdExpiresAt: metadata.octoHoldExpiresAt ?? "",
    };
  }

  const existingBooking = await getTourBookingByPaymentIntentId(intent.id);

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
      name: customerName,
      email: metadata.customerEmail ?? "",
      phone: metadata.customerPhone ?? "",
    },
    stripe: {
      paymentIntentId: intent.id,
      checkoutSessionId: session.id,
    },
    octo: octoData,
    paidAt: new Date().toISOString(),
    confirmationEmailsSentAt: existingBooking?.confirmationEmailsSentAt,
  };

  try {
    await upsertTourBookingByPaymentIntentId(intent.id, bookingPayload);
  } catch (error) {
    console.error("❌ Failed to persist tour booking", error);
    return new NextResponse("Failed to persist tour booking", { status: 500 });
  }

  if (!existingBooking?.confirmationEmailsSentAt) {
    try {
      await sendTourBookingEmails({
        ...bookingPayload,
        id: intent.id,
        createdAt: existingBooking?.createdAt ?? new Date().toISOString(),
      });

      await upsertTourBookingByPaymentIntentId(intent.id, {
        ...bookingPayload,
        confirmationEmailsSentAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Failed to send tour booking confirmation emails", error);
      return new NextResponse("Failed to send confirmation emails", { status: 500 });
    }
  }

  return NextResponse.json({ received: true, stored: true });
}

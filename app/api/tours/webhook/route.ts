import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getTourProductById } from "@/lib/tours/config";
import {
  getTourBookingByPaymentIntentId,
  markTourBookingConfirmationEmailsSent,
  upsertTourBookingByPaymentIntentId,
} from "@/lib/tours/bookingStore";
import { sendTourBookingEmails } from "@/lib/tours/email";
import { confirmOctoBooking } from "@/lib/tours/octo";
import { toursStripe } from "@/lib/tours/stripe";
import type { TourBooking } from "@/lib/types";

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

function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
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

  const octoBookingUuid = metadata.octoBookingUuid?.trim() ?? "";
  if (!octoBookingUuid) {
    console.error("❌ Missing octoBookingUuid in payment metadata");
    return new NextResponse("Missing octoBookingUuid", { status: 500 });
  }

  const customerName = metadata.customerName ?? "";

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
    paidAt: existingBooking?.paidAt ?? new Date().toISOString(),
    confirmationEmailsSentAt: existingBooking?.confirmationEmailsSentAt,
  };

  try {
    await upsertTourBookingByPaymentIntentId(intent.id, bookingPayload);
  } catch (error) {
    console.error("❌ Failed to store tour booking", error);
    return new NextResponse("Failed to store tour booking", { status: 500 });
  }

  const bookingForEmail: TourBooking = {
    id: existingBooking?.id ?? intent.id,
    createdAt: existingBooking?.createdAt ?? new Date().toISOString(),
    ...bookingPayload,
  };

  if (!existingBooking?.confirmationEmailsSentAt) {
    const emailResult = await sendTourBookingEmails(bookingForEmail);

    if (emailResult.success) {
      const sentAt = new Date().toISOString();

      try {
        await markTourBookingConfirmationEmailsSent(intent.id, sentAt);
      } catch (error) {
        console.error("❌ Failed to mark confirmation emails as sent", error);
        return new NextResponse("Failed to mark confirmation emails as sent", {
          status: 500,
        });
      }

      console.log(
        "✅ TOURS_BOOKING_EMAILS_SENT",
        JSON.stringify({
          paymentIntentId: intent.id,
          customerEmail: bookingPayload.customer.email,
          sentAt,
        })
      );
    } else {
      console.error(
        "❌ TOURS_BOOKING_EMAILS_FAILED",
        JSON.stringify({
          paymentIntentId: intent.id,
          message: emailResult.message,
        })
      );
    }
  } else {
    console.log(
      "ℹ️ TOURS_BOOKING_EMAILS_SKIPPED_ALREADY_SENT",
      JSON.stringify({
        paymentIntentId: intent.id,
        confirmationEmailsSentAt: existingBooking.confirmationEmailsSentAt,
      })
    );
  }

  console.log(
    "✅ TOURS_BOOKING_CONFIRMED_IN_OCTO",
    JSON.stringify({
      paymentIntentId: intent.id,
      octoBookingUuid,
      octoConfirmedAt: octoConfirm.utcConfirmedAt,
      voucherDeliveryValue: octoConfirm.voucherDeliveryValue,
    })
  );

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

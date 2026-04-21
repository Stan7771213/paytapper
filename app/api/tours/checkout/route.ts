import { NextRequest, NextResponse } from "next/server";

import { getAvailabilityProvider } from "@/lib/tours/availability";
import { getTourProductById } from "@/lib/tours/config";
import { createOctoHold } from "@/lib/tours/octo";
import { toursStripe } from "@/lib/tours/stripe";
import {
  ALLOWED_SLOT_TIMES,
  BOOKING_CUTOFF_MINUTES,
  isValidDateString,
} from "@/lib/tours/validation";

export const runtime = "nodejs";

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
  productId?: unknown;
  name?: unknown;
  countryCode?: unknown;
  phone?: unknown;
  email?: unknown;
  adults?: unknown;
  children?: unknown;
  date?: unknown;
  time?: unknown;
};

function isPositiveInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value > 0
  );
}

function isNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
  );
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string): boolean {
  return /^[0-9\s\-()]{5,20}$/.test(value);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody;

    const productId =
      typeof body.productId === "string" ? body.productId.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const countryCode =
      typeof body.countryCode === "string" ? body.countryCode.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const date = typeof body.date === "string" ? body.date.trim() : "";
    const time = typeof body.time === "string" ? body.time.trim() : "";

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const product = getTourProductById(productId);
    if (!product) {
      return NextResponse.json({ error: "Unknown productId" }, { status: 404 });
    }

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    if (!countryCode) {
      return NextResponse.json({ error: "countryCode is required" }, { status: 400 });
    }

    if (!phone || !isValidPhone(phone)) {
      return NextResponse.json({ error: "Valid phone is required" }, { status: 400 });
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (!isPositiveInteger(body.adults)) {
      return NextResponse.json(
        { error: "adults must be a positive integer" },
        { status: 400 }
      );
    }

    if (!isNonNegativeInteger(body.children)) {
      return NextResponse.json(
        { error: "children must be a non-negative integer" },
        { status: 400 }
      );
    }

    if (!date || !isValidDateString(date)) {
      return NextResponse.json({ error: "Valid date is required" }, { status: 400 });
    }

    if (!time || !ALLOWED_SLOT_TIMES.includes(time as (typeof ALLOWED_SLOT_TIMES)[number])) {
      return NextResponse.json({ error: "Valid time is required" }, { status: 400 });
    }

    const adults = body.adults;
    const children = body.children;
    const totalGuests = adults + children;
    const freeChildren = Math.min(children, adults);
    const extraPaidChildren = Math.max(children - adults, 0);
    const payableGuests = adults + extraPaidChildren;

    if (totalGuests <= 0) {
      return NextResponse.json(
        { error: "At least one guest is required" },
        { status: 400 }
      );
    }

    const provider = getAvailabilityProvider();
    const availability = await provider.getAvailability({ productId, date });
    const slot = availability.slots.find((item) => item.time === time);

    if (!slot || !slot.isBookable) {
      return NextResponse.json(
        { error: "Selected time is no longer available" },
        { status: 409 }
      );
    }

    if (slot.capacityRemaining < totalGuests) {
      return NextResponse.json(
        {
          error: "Not enough places left for the selected time",
          details: {
            capacityRemaining: slot.capacityRemaining,
            requestedGuests: totalGuests,
          },
        },
        { status: 409 }
      );
    }

    if (!slot.octoAvailabilityId) {
      return NextResponse.json(
        { error: "Missing OCTO availability id for selected slot" },
        { status: 500 }
      );
    }

    const hold = await createOctoHold({
      productId: product.octoProductId,
      optionId: product.octoOptionId,
      availabilityId: slot.octoAvailabilityId,
      adultUnitId: product.octoAdultUnitId,
      childUnitId: product.octoChildUnitId,
      adults,
      children,
      expirationMinutes: 15,
      notes: "Hold created from reseller checkout flow",
    });

    if (hold.status !== "ON_HOLD") {
      return NextResponse.json(
        {
          error: "Failed to place booking on hold",
          details: { holdStatus: hold.status },
        },
        { status: 409 }
      );
    }

    const fullPhone = `${countryCode}${phone}`.replace(/\s+/g, "");
    const amountCents = payableGuests * product.priceCents;
    const baseUrl = getBaseUrl();

    const metadata = {
      paymentDomain: "tours",
      tourProductId: product.id,
      tourDate: date,
      tourTime: time,
      customerName: name,
      customerEmail: email,
      customerPhone: fullPhone,
      adults: String(adults),
      children: String(children),
      freeChildren: String(freeChildren),
      extraPaidChildren: String(extraPaidChildren),
      payableGuests: String(payableGuests),
      totalGuests: String(totalGuests),
      cutoffMinutes: String(BOOKING_CUTOFF_MINUTES),
      octoBookingUuid: hold.bookingUuid,
      octoAvailabilityId: hold.availabilityId,
      octoHoldExpiresAt: hold.utcExpiresAt ?? "",
    };

    const session = await toursStripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: product.currency.toLowerCase(),
            product_data: {
              name: `${product.title} — ${date} ${time}`,
              description: `Adults: ${adults}, children under 12: ${children}, free children covered: ${freeChildren}, extra paid children: ${extraPaidChildren}.`,
            },
            unit_amount: product.priceCents,
          },
          quantity: payableGuests,
        },
      ],
      success_url: `${baseUrl}/tours/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/tours/cancel`,
      payment_intent_data: {
        metadata,
      },
      metadata,
    });

    return NextResponse.json({
      checkoutSessionId: session.id,
      url: session.url,
      hold: {
        bookingUuid: hold.bookingUuid,
        status: hold.status,
        utcExpiresAt: hold.utcExpiresAt,
      },
      summary: {
        productId: product.id,
        date,
        time,
        adults,
        children,
        freeChildren,
        extraPaidChildren,
        payableGuests,
        totalGuests,
        amountCents,
      },
    });
  } catch (err) {
    const details = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Unable to create tour checkout session", details },
      { status: 500 }
    );
  }
}

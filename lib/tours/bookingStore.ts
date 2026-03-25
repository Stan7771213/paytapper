import type { TourBooking } from "@/lib/types";
import { readJsonArray, writeJsonArray } from "@/lib/jsonStorage";

const TOUR_BOOKINGS_PATH = "tour_bookings.json";

type TourBookingUpsertInput = {
  productId: string;
  productTitle: string;
  date: string;
  time: string;
  adults: number;
  children: number;
  freeChildren: number;
  extraPaidChildren: number;
  payableGuests: number;
  totalGuests: number;
  amountCents: number;
  currency: "eur";
  status: TourBooking["status"];
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  stripe: {
    paymentIntentId: string;
    checkoutSessionId: string;
  };
  paidAt: string;
};

export async function getAllTourBookings(): Promise<TourBooking[]> {
  return readJsonArray<TourBooking>(TOUR_BOOKINGS_PATH);
}

export async function upsertTourBookingByPaymentIntentId(
  paymentIntentId: string,
  input: TourBookingUpsertInput
): Promise<void> {
  if (!paymentIntentId || !paymentIntentId.startsWith("pi_")) {
    throw new Error("Invalid paymentIntentId");
  }

  if (!input.stripe.checkoutSessionId.startsWith("cs_")) {
    throw new Error("checkoutSessionId must be a real Stripe session id");
  }

  const bookings = await getAllTourBookings();
  const idx = bookings.findIndex(
    (booking) => booking.stripe.paymentIntentId === paymentIntentId
  );

  if (idx >= 0) {
    const existing = bookings[idx];

    bookings[idx] = {
      ...existing,
      ...input,
      id: existing.id,
      createdAt: existing.createdAt,
      paidAt: existing.paidAt ?? input.paidAt,
    };
  } else {
    bookings.push({
      id: paymentIntentId,
      createdAt: new Date().toISOString(),
      ...input,
    });
  }

  await writeJsonArray(TOUR_BOOKINGS_PATH, bookings);
}

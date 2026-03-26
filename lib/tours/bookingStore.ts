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
  confirmationEmailsSentAt?: string;
};

export async function getAllTourBookings(): Promise<TourBooking[]> {
  return readJsonArray<TourBooking>(TOUR_BOOKINGS_PATH);
}

export async function getTourBookingByPaymentIntentId(
  paymentIntentId: string
): Promise<TourBooking | null> {
  const bookings = await getAllTourBookings();
  return (
    bookings.find((booking) => booking.stripe.paymentIntentId === paymentIntentId) ??
    null
  );
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
      confirmationEmailsSentAt:
        existing.confirmationEmailsSentAt ?? input.confirmationEmailsSentAt,
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

export async function markTourBookingConfirmationEmailsSent(
  paymentIntentId: string,
  sentAt: string
): Promise<void> {
  const bookings = await getAllTourBookings();
  const idx = bookings.findIndex(
    (booking) => booking.stripe.paymentIntentId === paymentIntentId
  );

  if (idx < 0) {
    throw new Error("Tour booking not found for paymentIntentId=" + paymentIntentId);
  }

  const existing = bookings[idx];
  if (existing.confirmationEmailsSentAt) {
    return;
  }

  bookings[idx] = {
    ...existing,
    confirmationEmailsSentAt: sentAt,
  };

  await writeJsonArray(TOUR_BOOKINGS_PATH, bookings);
}

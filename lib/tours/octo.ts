import type { SlotAvailability, TourSlotTime } from "@/lib/tours/types";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error("Missing required environment variable: " + name);
  }
  return value.trim();
}

function getOctoBaseUrl(): string {
  return requireEnv("OCTO_API_BASE_URL").replace(/\/+$/, "");
}

function getOctoToken(): string {
  return requireEnv("OCTO_API_TOKEN");
}

async function octoFetch(path: string, init?: RequestInit): Promise<Response> {
  const baseUrl = getOctoBaseUrl();
  const token = getOctoToken();

  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Octo-Capabilities": "octo/content",
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

type OctoAvailabilityItem = {
  id: string;
  available: boolean;
  status: string;
  vacancies: number;
  capacity: number;
  maxUnits: number;
  utcCutoffAt: string | null;
  localDateTimeStart: string;
};

function extractTimeFromIso(localDateTimeStart: string): TourSlotTime {
  const time = localDateTimeStart.slice(11, 16);
  if (time !== "10:00" && time !== "13:00" && time !== "15:30") {
    throw new Error(`Unexpected OCTO slot time: ${time}`);
  }
  return time;
}

export type OctoAvailabilityParams = {
  productId: string;
  optionId: string;
  localDate: string;
};

export type OctoSlotAvailability = SlotAvailability & {
  octoAvailabilityId: string;
  utcCutoffAt: string | null;
};

export async function getOctoAvailability(
  params: OctoAvailabilityParams
): Promise<OctoSlotAvailability[]> {
  const response = await octoFetch("/availability", {
    method: "POST",
    body: JSON.stringify({
      productId: params.productId,
      optionId: params.optionId,
      localDate: params.localDate,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `OCTO availability request failed: ${response.status} ${details}`
    );
  }

  const data = (await response.json()) as OctoAvailabilityItem[];

  return data.map((item) => ({
    date: params.localDate,
    time: extractTimeFromIso(item.localDateTimeStart),
    capacityTotal: item.capacity,
    capacityRemaining: item.vacancies,
    isBookable: item.available && item.status === "AVAILABLE" && item.vacancies > 0,
    cutoffMinutes: 15,
    octoAvailabilityId: item.id,
    utcCutoffAt: item.utcCutoffAt,
  }));
}

function createUuid(): string {
  return crypto.randomUUID();
}

type OctoHoldParams = {
  productId: string;
  optionId: string;
  availabilityId: string;
  adultUnitId: string;
  childUnitId: string;
  adults: number;
  children: number;
  expirationMinutes?: number;
  notes?: string;
};

export type OctoHoldResult = {
  bookingUuid: string;
  status: string;
  utcCreatedAt: string | null;
  utcExpiresAt: string | null;
  availabilityId: string;
};

export async function createOctoHold(
  params: OctoHoldParams
): Promise<OctoHoldResult> {
  const unitItems = [
    ...Array.from({ length: params.adults }, () => ({
      uuid: createUuid(),
      unitId: params.adultUnitId,
    })),
    ...Array.from({ length: params.children }, () => ({
      uuid: createUuid(),
      unitId: params.childUnitId,
    })),
  ];

  const response = await octoFetch("/bookings/", {
    method: "POST",
    body: JSON.stringify({
      uuid: createUuid(),
      productId: params.productId,
      optionId: params.optionId,
      availabilityId: params.availabilityId,
      expirationMinutes: params.expirationMinutes ?? 15,
      notes: params.notes ?? "Hold created from reseller checkout flow",
      unitItems,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OCTO hold request failed: ${response.status} ${details}`);
  }

  const data = (await response.json()) as {
    uuid: string;
    status: string;
    utcCreatedAt?: string | null;
    utcExpiresAt?: string | null;
    availabilityId: string;
  };

  return {
    bookingUuid: data.uuid,
    status: data.status,
    utcCreatedAt: data.utcCreatedAt ?? null,
    utcExpiresAt: data.utcExpiresAt ?? null,
    availabilityId: data.availabilityId,
  };
}

type OctoConfirmParams = {
  bookingUuid: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  country: string;
};

export type OctoConfirmResult = {
  bookingUuid: string;
  status: string;
  utcConfirmedAt: string | null;
  voucherDeliveryValue: string | null;
};

export async function confirmOctoBooking(
  params: OctoConfirmParams
): Promise<OctoConfirmResult> {
  const response = await octoFetch(`/bookings/${params.bookingUuid}/confirm`, {
    method: "POST",
    body: JSON.stringify({
      contact: {
        fullName: params.fullName,
        emailAddress: params.emailAddress,
        phoneNumber: params.phoneNumber,
        country: params.country,
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OCTO confirm request failed: ${response.status} ${details}`);
  }

  const data = (await response.json()) as {
    uuid: string;
    status: string;
    utcConfirmedAt?: string | null;
    voucher?: {
      deliveryOptions?: Array<{
        deliveryFormat?: string;
        deliveryValue?: string | null;
      }>;
    };
  };

  const voucherDeliveryValue =
    data.voucher?.deliveryOptions?.[0]?.deliveryValue ?? null;

  return {
    bookingUuid: data.uuid,
    status: data.status,
    utcConfirmedAt: data.utcConfirmedAt ?? null,
    voucherDeliveryValue,
  };
}

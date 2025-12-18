import type { Payment } from "@/lib/types";
import { readJsonArray, writeJsonArray } from "@/lib/jsonStorage";

const PAYMENTS_PATH = "payments.json";

type PaymentUpsertInput = {
  clientId: string;
  amountCents: number;
  currency: "eur";
  platformFeeCents: number;
  netAmountCents: number;
  status: Payment["status"];
  paidAt?: string;
  stripe: {
    paymentIntentId: string;
    checkoutSessionId: string;
  };
};

export async function getAllPayments(): Promise<Payment[]> {
  return readJsonArray<Payment>(PAYMENTS_PATH);
}

export async function getPaymentsByClientId(
  clientId: string
): Promise<Payment[]> {
  const payments = await getAllPayments();
  return payments.filter((p) => p.clientId === clientId);
}

export async function getPaymentsSummaryByClientId(
  clientId: string
): Promise<{
  totalCount: number;
  totalGrossCents: number;
  totalNetCents: number;
  lastPaymentAt?: string;
}> {
  const payments = await getPaymentsByClientId(clientId);

  let totalGrossCents = 0;
  let totalNetCents = 0;
  let lastPaymentAt: string | undefined;

  for (const p of payments) {
    totalGrossCents += p.amountCents;
    totalNetCents += p.netAmountCents;

    const date = p.paidAt ?? p.createdAt;
    if (!lastPaymentAt || date > lastPaymentAt) {
      lastPaymentAt = date;
    }
  }

  return {
    totalCount: payments.length,
    totalGrossCents,
    totalNetCents,
    lastPaymentAt,
  };
}

export async function upsertPaymentByPaymentIntentId(
  paymentIntentId: string,
  input: PaymentUpsertInput
): Promise<void> {
  if (!paymentIntentId || !paymentIntentId.startsWith("pi_")) {
    throw new Error("Invalid paymentIntentId");
  }

  if (!input.stripe.checkoutSessionId.startsWith("cs_")) {
    throw new Error("checkoutSessionId must be a real Stripe session id");
  }

  const payments = await getAllPayments();
  const idx = payments.findIndex(
    (p) => p.stripe.paymentIntentId === paymentIntentId
  );

  if (idx >= 0) {
    const existing = payments[idx];

    payments[idx] = {
      ...existing,
      ...input,
      id: existing.id,
      createdAt: existing.createdAt,
      paidAt: existing.paidAt ?? input.paidAt,
    };
  } else {
    payments.push({
      id: paymentIntentId,
      createdAt: new Date().toISOString(),
      ...input,
    });
  }

  await writeJsonArray(PAYMENTS_PATH, payments);
}

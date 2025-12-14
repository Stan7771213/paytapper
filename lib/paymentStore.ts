import type { Payment } from "@/lib/types";
import { readJsonArray, writeJsonArray } from "@/lib/jsonStorage";

const PAYMENTS_PATH = "data/payments.json";

export async function getAllPayments(): Promise<Payment[]> {
  return readJsonArray<Payment>(PAYMENTS_PATH);
}

export async function getPaymentsByClientId(clientId: string): Promise<Payment[]> {
  const payments = await getAllPayments();
  return payments.filter((p) => p.clientId === clientId);
}

export async function upsertPaymentByPaymentIntentId(
  paymentIntentId: string,
  input: Omit<Payment, "id">
): Promise<void> {
  if (!paymentIntentId || !paymentIntentId.startsWith("pi_")) {
    throw new Error("Invalid paymentIntentId");
  }

  if (
    !input.stripe?.checkoutSessionId ||
    !input.stripe.checkoutSessionId.startsWith("cs_")
  ) {
    throw new Error("checkoutSessionId must be a real Stripe session id");
  }

  const payments = await getAllPayments();
  const idx = payments.findIndex(
    (p) => p.stripe.paymentIntentId === paymentIntentId
  );

  if (idx >= 0) {
    payments[idx] = {
      ...payments[idx],
      ...input,
      id: payments[idx].id,
    };
  } else {
    payments.push({
      id: paymentIntentId,
      ...input,
    });
  }

  await writeJsonArray(PAYMENTS_PATH, payments);
}

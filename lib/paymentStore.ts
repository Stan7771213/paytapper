// lib/paymentStore.ts

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Payment, PaymentStatus } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "payments.json");

function readPayments(): Payment[] {
  if (!fs.existsSync(DATA_PATH)) return [];
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw) as Payment[];
}

function writePayments(payments: Payment[]): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(payments, null, 2) + "\n");
}

function nowIso(): string {
  return new Date().toISOString();
}

// ---------- Public API ----------

export function getAllPayments(): Payment[] {
  return readPayments();
}

export function getPaymentsByClientId(clientId: string): Payment[] {
  return readPayments()
    .filter((p) => p.clientId === clientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getPaymentByPaymentIntentId(paymentIntentId: string): Payment | null {
  const payments = readPayments();
  return payments.find((p) => p.stripe.paymentIntentId === paymentIntentId) ?? null;
}

/**
 * Upsert by paymentIntentId (canonical Stripe identifier).
 * If payment exists -> update. If not -> create.
 *
 * Architectural guarantees:
 * - never persists placeholder values
 * - deterministic key: paymentIntentId
 * - checkoutSessionId must be real (cs_*)
 */
export function upsertPaymentByPaymentIntentId(
  paymentIntentId: string,
  data: Omit<Payment, "id" | "createdAt">
): Payment {
  if (!paymentIntentId || paymentIntentId.trim().length === 0) {
    throw new Error("paymentIntentId is required");
  }

  if (data.stripe.paymentIntentId !== paymentIntentId) {
    throw new Error("stripe.paymentIntentId must match paymentIntentId argument");
  }

  const checkoutSessionId = data.stripe.checkoutSessionId;
  if (!checkoutSessionId || !checkoutSessionId.startsWith("cs_")) {
    throw new Error("stripe.checkoutSessionId must be a real Checkout Session id (cs_*)");
  }

  const payments = readPayments();
  const existingIndex = payments.findIndex(
    (p) => p.stripe.paymentIntentId === paymentIntentId
  );

  if (existingIndex === -1) {
    const created: Payment = {
      id: randomUUID(),
      createdAt: nowIso(),
      ...data,
      stripe: {
        paymentIntentId,
        checkoutSessionId,
      },
    };

    payments.push(created);
    writePayments(payments);
    return created;
  }

  const current = payments[existingIndex];

  const updated: Payment = {
    ...current,
    ...data,
    stripe: {
      paymentIntentId,
      checkoutSessionId,
    },
  };

  payments[existingIndex] = updated;
  writePayments(payments);
  return updated;
}

/**
 * Optional helper (not currently used by routes, but kept for consistency)
 */
export function updatePaymentStatusByPaymentIntentId(
  paymentIntentId: string,
  status: PaymentStatus,
  paidAt?: string
): Payment {
  const payments = readPayments();
  const index = payments.findIndex(
    (p) => p.stripe.paymentIntentId === paymentIntentId
  );

  if (index === -1) {
    throw new Error(`Payment not found for paymentIntentId=${paymentIntentId}`);
  }

  const current = payments[index];
  const updated: Payment = {
    ...current,
    status,
    paidAt: paidAt ?? (status === "paid" ? nowIso() : current.paidAt),
  };

  payments[index] = updated;
  writePayments(payments);
  return updated;
}

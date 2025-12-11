// lib/paymentStore.ts
import fs from "fs/promises";
import path from "path";

const DATA_FILE_PATH = path.join(process.cwd(), "data", "payments.json");

export type PaymentStatus = "succeeded" | "pending" | "failed" | string;
export type PaymentType = "tip" | "payment" | string;

export type Payment = {
  id: string;
  clientId: string;
  amountCents: number;
  platformFeeCents: number;
  clientAmountCents: number;
  currency: string;
  status: PaymentStatus;
  type: PaymentType;
  stripePaymentIntentId?: string;
  createdAt: string; // ISO string
  raw?: unknown;
};

export type NewPayment = {
  clientId: string;
  amountCents: number;
  platformFeeCents: number;
  clientAmountCents: number;
  currency: string;
  status: PaymentStatus;
  type: PaymentType;
  stripePaymentIntentId?: string;
  createdAt?: string;
  raw?: unknown;
};

type PaymentsFileShape = {
  payments: Payment[];
};

async function ensureFileExists() {
  try {
    await fs.access(DATA_FILE_PATH);
  } catch {
    const initial: PaymentsFileShape = { payments: [] };
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readPaymentsFile(): Promise<PaymentsFileShape> {
  await ensureFileExists();

  const raw = await fs.readFile(DATA_FILE_PATH, "utf8");

  if (!raw.trim()) {
    return { payments: [] };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.payments)) {
      return { payments: [] };
    }
    return {
      payments: parsed.payments as Payment[],
    };
  } catch (err) {
    console.error("Failed to parse payments.json, resetting file.", err);
    return { payments: [] };
  }
}

async function writePaymentsFile(data: PaymentsFileShape): Promise<void> {
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Add a new payment entry to payments.json
 */
export async function addPayment(newPayment: NewPayment): Promise<Payment> {
  const now = new Date().toISOString();
  const id = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const payment: Payment = {
    id,
    createdAt: newPayment.createdAt ?? now,
    ...newPayment,
  };

  const data = await readPaymentsFile();
  data.payments.push(payment);
  await writePaymentsFile(data);

  return payment;
}

/**
 * Get all payments for a specific clientId.
 */
export async function getPaymentsByClient(
  clientId: string
): Promise<Payment[]> {
  const data = await readPaymentsFile();
  return data.payments.filter((p) => p.clientId === clientId);
}

/**
 * Get all payments (might be useful later).
 */
export async function getAllPayments(): Promise<Payment[]> {
  const data = await readPaymentsFile();
  return data.payments;
}


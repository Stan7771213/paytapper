import fs from "fs";
import path from "path";

export type PaymentStatus = "succeeded" | "pending" | "failed";

export type PaymentRecord = {
  id: string; // internal ID, e.g. "pay_1699999999999"
  stripePaymentIntentId?: string | null;
  stripeCheckoutSessionId?: string | null;
  clientId: string; // userId / clientId who receives the payment
  amountTotal: number; // in cents
  currency: string; // e.g. "eur"
  platformFeeAmount?: number; // in cents
  clientAmount?: number; // in cents
  status: PaymentStatus;
  createdAt: string; // ISO date
};

const PAYMENTS_FILE_PATH = path.join(process.cwd(), "data", "payments.json");

function ensurePaymentsFileExists() {
  try {
    if (!fs.existsSync(PAYMENTS_FILE_PATH)) {
      const dir = path.dirname(PAYMENTS_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(PAYMENTS_FILE_PATH, "[]", "utf-8");
    }
  } catch (error) {
    console.error("Failed to ensure payments file exists:", error);
  }
}

function readPaymentsSync(): PaymentRecord[] {
  try {
    ensurePaymentsFileExists();
    const raw = fs.readFileSync(PAYMENTS_FILE_PATH, "utf-8");
    if (!raw.trim()) {
      return [];
    }
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      console.warn("payments.json is not an array, resetting to empty array");
      return [];
    }
    return data as PaymentRecord[];
  } catch (error) {
    console.error("Failed to read payments.json:", error);
    return [];
  }
}

function writePaymentsSync(payments: PaymentRecord[]): void {
  try {
    const json = JSON.stringify(payments, null, 2);
    fs.writeFileSync(PAYMENTS_FILE_PATH, json, "utf-8");
  } catch (error) {
    console.error("Failed to write payments.json:", error);
  }
}

function generatePaymentId(): string {
  return `pay_${Date.now()}`;
}

/**
 * Add a new payment record.
 * Required fields are everything except id and createdAt,
 * which will be generated if not provided.
 */
export function addPayment(
  payment: Omit<PaymentRecord, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  }
): PaymentRecord {
  const payments = readPaymentsSync();

  const newRecord: PaymentRecord = {
    id: payment.id ?? generatePaymentId(),
    createdAt: payment.createdAt ?? new Date().toISOString(),
    stripePaymentIntentId: payment.stripePaymentIntentId ?? null,
    stripeCheckoutSessionId: payment.stripeCheckoutSessionId ?? null,
    clientId: payment.clientId,
    amountTotal: payment.amountTotal,
    currency: payment.currency,
    platformFeeAmount: payment.platformFeeAmount,
    clientAmount: payment.clientAmount,
    status: payment.status,
  };

  payments.push(newRecord);
  writePaymentsSync(payments);

  return newRecord;
}

/**
 * Return all payments for a given clientId.
 */
export function listPaymentsByClient(clientId: string): PaymentRecord[] {
  const payments = readPaymentsSync();
  return payments.filter((p) => p.clientId === clientId);
}


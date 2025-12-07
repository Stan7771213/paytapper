import fs from "fs/promises";
import path from "path";

const PAYMENTS_FILE_PATH = path.join(process.cwd(), "data", "payments.json");
const isProd = process.env.NODE_ENV === "production";

export type Payment = {
  id: string;
  clientId: string;
  amountTotal: number;
  platformFeeAmount: number;
  clientAmount: number;
  currency: string;
  type: string; // e.g. "tip"
  createdAt: string; // ISO string
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
};

export type NewPayment = Omit<Payment, "id"> & { id?: string };

async function readPaymentsFromFile(): Promise<Payment[]> {
  try {
    const file = await fs.readFile(PAYMENTS_FILE_PATH, "utf8");
    if (!file.trim()) {
      return [];
    }
    return JSON.parse(file) as Payment[];
  } catch (error: any) {
    // Если файла нет или ошибка чтения — считаем, что платежей пока нет
    return [];
  }
}

async function writePaymentsToFile(payments: Payment[]): Promise<void> {
  if (isProd) {
    // В продакшене файловая система read-only на Vercel.
    // Просто ничего не делаем, чтобы не было ошибок.
    return;
  }

  const json = JSON.stringify(payments, null, 2);
  await fs.writeFile(PAYMENTS_FILE_PATH, json, "utf8");
}

/**
 * Добавить новый платеж.
 * В dev пишет в JSON-файл.
 * В prod НИЧЕГО не пишет, но возвращает корректный объект,
 * чтобы вебхук и остальной код не падали.
 */
export async function addPayment(newPayment: NewPayment): Promise<Payment> {
  const payment: Payment = {
    id:
      newPayment.id ||
      newPayment.stripePaymentIntentId ||
      `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ...newPayment,
    createdAt: newPayment.createdAt || new Date().toISOString(),
  };

  if (isProd) {
    // В продакшене не пытаемся читать/писать файл — просто возвращаем объект.
    return payment;
  }

  const payments = await readPaymentsFromFile();
  payments.push(payment);
  await writePaymentsToFile(payments);

  return payment;
}

/**
 * Получить все платежи.
 * В prod: лучшая попытка чтения, но если файла нет или он не обновляется — вернётся [].
 */
export async function getAllPayments(): Promise<Payment[]> {
  if (isProd) {
    try {
      return await readPaymentsFromFile();
    } catch {
      return [];
    }
  }

  return readPaymentsFromFile();
}

/**
 * Получить платежи по clientId.
 */
export async function getPaymentsByClientId(
  clientId: string
): Promise<Payment[]> {
  const payments = await getAllPayments();
  return payments.filter((p) => p.clientId === clientId);
}


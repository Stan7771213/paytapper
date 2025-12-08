import fs from "fs/promises";
import path from "path";

const isProd = process.env.NODE_ENV === "production";

const PAYMENTS_FILE_PATH = path.join(process.cwd(), "data", "payments.json");

export type PaymentStatus = "succeeded" | "pending" | "failed" | "canceled";
export type PaymentType = "tip" | "payment";

/**
 * Полная запись платежа, как она хранится в системе.
 */
export interface Payment {
  id: string; // внутренний ID записи (по умолчанию = paymentIntentId)
  clientId: string;

  amountTotal: number; // полная сумма, полученная Stripe (в центах)
  platformFeeAmount: number; // комиссия платформы (в центах)
  clientAmount: number; // сумма для клиента (в центах)
  currency: string; // например "eur"

  status: PaymentStatus; // например "succeeded"
  type: PaymentType; // например "tip"

  stripePaymentIntentId?: string | null;
  stripeCheckoutSessionId?: string | null;

  createdAt: string; // ISO-строка даты создания записи
}

/**
 * Тип для создания нового платежа.
 * Позволяет НЕ указывать id и createdAt — они будут сгенерированы в addPayment.
 * При этом поддерживает ВСЕ поля, которые мы реально передаём из webhook.
 */
export type NewPayment = Omit<Payment, "id" | "createdAt"> & {
  id?: string;
  createdAt?: string;
};

/**
 * Вспомогательная функция: безопасно прочитать payments.json.
 * В dev — обычное чтение из файла.
 * В prod — используется только там, где это явно нужно (getAllPayments),
 * и всегда обёрнуто в try/catch.
 */
async function readPaymentsFromFile(): Promise<Payment[]> {
  try {
    const fileData = await fs.readFile(PAYMENTS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(fileData);
    if (Array.isArray(parsed)) {
      return parsed as Payment[];
    }
    return [];
  } catch (error) {
    // Файл может отсутствовать или быть недоступен — в этом случае просто [].
    return [];
  }
}

/**
 * Вспомогательная функция: безопасно записать payments.json в dev.
 * В prod мы её не вызываем.
 */
async function writePaymentsToFile(payments: Payment[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(PAYMENTS_FILE_PATH), { recursive: true });
    await fs.writeFile(
      PAYMENTS_FILE_PATH,
      JSON.stringify(payments, null, 2),
      "utf-8"
    );
  } catch (error) {
    console.error("Failed to write payments file:", error);
  }
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


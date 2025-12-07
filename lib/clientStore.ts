import fs from "fs";
import path from "path";

export type ClientStatus = "pending" | "active" | "restricted";

export interface Client {
  clientId: string;
  stripeAccountId: string;
  name?: string;
  email?: string;
  imageUrl?: string;
  status: ClientStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

const DATA_DIR = path.join(process.cwd(), "data");
const CLIENTS_FILE = path.join(DATA_DIR, "clients.json");
const isProd = process.env.NODE_ENV === "production";

function ensureDataFile() {
  // В продакшене ничего не создаём на диске
  if (isProd) return;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CLIENTS_FILE)) {
    fs.writeFileSync(CLIENTS_FILE, "[]", "utf8");
  }
}

function readAllClients(): Client[] {
  try {
    if (!isProd) {
      // В dev гарантируем наличие файла
      ensureDataFile();
    }

    const raw = fs.readFileSync(CLIENTS_FILE, "utf8");
    if (!raw.trim()) return [];
    return JSON.parse(raw) as Client[];
  } catch {
    // Если файла нет или ошибка чтения — просто считаем, что клиентов нет
    return [];
  }
}

function writeAllClients(clients: Client[]) {
  // В продакшене файловая система read-only, ничего не пишем
  if (isProd) return;

  ensureDataFile();
  fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2), "utf8");
}

export function getClientById(clientId: string): Client | undefined {
  const clients = readAllClients();
  return clients.find((c) => c.clientId === clientId);
}

export function getClientByStripeAccountId(
  stripeAccountId: string
): Client | undefined {
  const clients = readAllClients();
  return clients.find((c) => c.stripeAccountId === stripeAccountId);
}

export function upsertClient(client: Client): Client {
  const clients = readAllClients();
  const index = clients.findIndex((c) => c.clientId === client.clientId);
  if (index === -1) {
    clients.push(client);
  } else {
    clients[index] = client;
  }
  writeAllClients(clients);
  return client;
}

export function updateClient(
  clientId: string,
  partial: Partial<Client>
): Client | undefined {
  const clients = readAllClients();
  const index = clients.findIndex((c) => c.clientId === clientId);
  if (index === -1) return undefined;

  const existing = clients[index];
  const updated: Client = {
    ...existing,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  clients[index] = updated;
  writeAllClients(clients);
  return updated;
}

export function createClientIfNotExists(params: {
  clientId: string;
  stripeAccountId: string;
  name?: string;
  email?: string;
}): Client {
  const existing = getClientById(params.clientId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const client: Client = {
    clientId: params.clientId,
    stripeAccountId: params.stripeAccountId,
    name: params.name,
    email: params.email,
    imageUrl: undefined,
    status: "pending",
    chargesEnabled: false,
    payoutsEnabled: false,
    createdAt: now,
    updatedAt: now,
  };

  return upsertClient(client);
}


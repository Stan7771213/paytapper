// lib/clientStore.ts

import fs from "fs";
import path from "path";

export type Client = {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  stripeAccountId?: string;
  qrEmailSent?: boolean;
};

export type NewClient = {
  email: string;
  name?: string;
};

const dataDir = path.join(process.cwd(), "data");
const clientsFilePath = path.join(dataDir, "clients.json");

function ensureClientsFileExists() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(clientsFilePath)) {
    fs.writeFileSync(clientsFilePath, "[]", "utf8");
  }
}

function readClients(): Client[] {
  try {
    ensureClientsFileExists();
    const raw = fs.readFileSync(clientsFilePath, "utf8").trim();
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.error(
        "🔴 clients.json is not an array. Resetting to empty array."
      );
      return [];
    }
    return parsed as Client[];
  } catch (error) {
    console.error(
      "🔴 Failed to read clients.json. Returning empty array.",
      error
    );
    return [];
  }
}

function writeClients(clients: Client[]) {
  try {
    ensureClientsFileExists();
    fs.writeFileSync(
      clientsFilePath,
      JSON.stringify(clients, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("🔴 Failed to write clients.json:", error);
  }
}

function generateClientId(): string {
  const ts = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `client_${ts}_${random}`;
}

/**
 * Create a new client or return existing one by email
 */
export function createClient(newClient: NewClient): Client {
  const clients = readClients();

  const existing = clients.find(
    (c) => c.email.toLowerCase() === newClient.email.toLowerCase()
  );
  if (existing) {
    return existing;
  }

  const client: Client = {
    id: generateClientId(),
    email: newClient.email.trim(),
    name:
      newClient.name && newClient.name.trim().length > 0
        ? newClient.name.trim()
        : undefined,
    createdAt: new Date().toISOString(),
  };

  clients.push(client);
  writeClients(clients);

  return client;
}

export function getClientById(id: string): Client | undefined {
  const clients = readClients();
  return clients.find((c) => c.id === id);
}

export function getClientByEmail(email: string): Client | undefined {
  const clients = readClients();
  return clients.find(
    (c) => c.email.toLowerCase() === email.toLowerCase()
  );
}

export function getAllClients(): Client[] {
  return readClients();
}

/**
 * Find client by Stripe Connect account id (for future Connect flow)
 */
export function getClientByStripeAccountId(
  stripeAccountId: string
): Client | undefined {
  const clients = readClients();
  return clients.find((c) => c.stripeAccountId === stripeAccountId);
}

/**
 * Update client by id with partial fields (for Connect / flags etc.)
 */
export function updateClient(
  id: string,
  updates: Partial<Client>
): Client | null {
  const clients = readClients();
  const index = clients.findIndex((c) => c.id === id);

  if (index === -1) {
    return null;
  }

  const updated: Client = {
    ...clients[index],
    ...updates,
  };

  clients[index] = updated;
  writeClients(clients);

  return updated;
}


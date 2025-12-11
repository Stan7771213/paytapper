// lib/clientStore.ts
import fs from "fs/promises";
import path from "path";

const DATA_FILE_PATH = path.join(process.cwd(), "data", "clients.json");

export type Client = {
  id: string; // clientId used in URLs and QR links
  email: string;
  name?: string;
  createdAt: string; // ISO string
  stripeAccountId?: string;
  qrEmailSent?: boolean;
};

export type NewClient = {
  email: string;
  name?: string;
};

type ClientsFileShape = {
  clients: Client[];
};

async function ensureFileExists() {
  try {
    await fs.access(DATA_FILE_PATH);
  } catch {
    const initial: ClientsFileShape = { clients: [] };
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readClientsFile(): Promise<ClientsFileShape> {
  await ensureFileExists();

  const raw = await fs.readFile(DATA_FILE_PATH, "utf8");

  if (!raw.trim()) {
    return { clients: [] };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.clients)) {
      return { clients: [] };
    }
    return {
      clients: parsed.clients as Client[],
    };
  } catch (err) {
    console.error("Failed to parse clients.json, resetting file.", err);
    return { clients: [] };
  }
}

async function writeClientsFile(data: ClientsFileShape): Promise<void> {
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
}

function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a new client. If a client with this email already exists,
 * we return the existing one to avoid duplicates.
 */
export async function createClient(newClient: NewClient): Promise<Client> {
  const data = await readClientsFile();

  const existing = data.clients.find(
    (c) => c.email.toLowerCase() === newClient.email.toLowerCase()
  );
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const client: Client = {
    id: generateClientId(),
    email: newClient.email,
    name: newClient.name,
    createdAt: now,
    qrEmailSent: false,
  };

  data.clients.push(client);
  await writeClientsFile(data);

  return client;
}

export async function getClientById(id: string): Promise<Client | null> {
  const data = await readClientsFile();
  return data.clients.find((c) => c.id === id) ?? null;
}

export async function getClientByEmail(email: string): Promise<Client | null> {
  const data = await readClientsFile();
  return (
    data.clients.find(
      (c) => c.email.toLowerCase() === email.toLowerCase()
    ) ?? null
  );
}

export async function getAllClients(): Promise<Client[]> {
  const data = await readClientsFile();
  return data.clients;
}


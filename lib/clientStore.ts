// lib/clientStore.ts

import fs from "fs";
import path from "path";
import { Client, NewClient } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "clients.json");

function readClients(): Client[] {
  if (!fs.existsSync(DATA_PATH)) {
    return [];
  }

  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw) as Client[];
}

function writeClients(clients: Client[]): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(clients, null, 2));
}

// ---------- Public API ----------

export function getAllClients(): Client[] {
  return readClients();
}

export function getClientById(clientId: string): Client | null {
  const clients = readClients();
  return clients.find((c) => c.id === clientId) ?? null;
}

export function createClient(input: NewClient): Client {
  const clients = readClients();

  const newClient: Client = {
    id: crypto.randomUUID(),
    displayName: input.displayName,
    email: input.email,
    payoutMode: input.payoutMode,
    branding: input.branding,
    isActive: true,
    createdAt: new Date().toISOString(),
    stripe: {},
  };

  clients.push(newClient);
  writeClients(clients);

  return newClient;
}

export function updateClient(updated: Client): Client {
  const clients = readClients();
  const index = clients.findIndex((c) => c.id === updated.id);

  if (index === -1) {
    throw new Error(`Client not found: ${updated.id}`);
  }

  clients[index] = updated;
  writeClients(clients);

  return updated;
}


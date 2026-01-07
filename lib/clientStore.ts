import { randomUUID } from "node:crypto";
import type { Client, NewClient } from "@/lib/types";
import { readJsonArray, writeJsonArray } from "@/lib/jsonStorage";

const CLIENTS_PATH = "clients.json";

export async function getAllClients(): Promise<Client[]> {
  return readJsonArray<Client>(CLIENTS_PATH);
}

export async function getClientById(clientId: string): Promise<Client | null> {
  const clients = await getAllClients();
  return clients.find((c) => c.id === clientId) ?? null;
}

export async function getClientByOwnerUserId(
  userId: string
): Promise<Client | null> {
  const clients = await getAllClients();
  return clients.find((c) => c.ownerUserId === userId) ?? null;
}

export async function getClientByEmail(
  email: string
): Promise<Client | null> {
  const normalized = email.trim().toLowerCase();
  const clients = await getAllClients();
  return (
    clients.find(
      (c) => c.email && c.email.toLowerCase() === normalized
    ) ?? null
  );
}

export async function createClient(
  input: NewClient & { ownerUserId: string }
): Promise<Client> {
  const clients = await getAllClients();

  const client: Client = {
    id: randomUUID(),
    ownerUserId: input.ownerUserId,
    displayName: input.displayName,
    email: input.email,
    payoutMode: input.payoutMode,
    isActive: true,
    createdAt: new Date().toISOString(),
    dashboardToken: randomUUID(),
  };

  clients.push(client);
  await writeJsonArray(CLIENTS_PATH, clients);

  return client;
}

export async function updateClient(
  clientId: string,
  patch: Partial<Client>
): Promise<Client> {
  const clients = await getAllClients();
  const idx = clients.findIndex((c) => c.id === clientId);
  if (idx === -1) {
    throw new Error(`Client not found: ${clientId}`);
  }

  const next = { ...clients[idx], ...patch };
  clients[idx] = next;
  await writeJsonArray(CLIENTS_PATH, clients);
  return next;
}

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

export async function createClient(input: NewClient): Promise<Client> {
  const clients = await getAllClients();

  const client: Client = {
    id: randomUUID(),
    displayName: input.displayName,
    email: input.email,
    payoutMode: input.payoutMode,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  clients.push(client);
  await writeJsonArray(CLIENTS_PATH, clients);

  return client;
}

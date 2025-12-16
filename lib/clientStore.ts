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

/**
 * Update a client deterministically.
 *
 * Rules:
 * - createdAt must never be overwritten
 * - stripe.accountId must never be overwritten once set
 */
export async function updateClient(
  clientId: string,
  patch: {
    displayName?: string;
    email?: string;
    isActive?: boolean;
    payoutMode?: Client["payoutMode"];
    stripe?: { accountId?: string };
    branding?: Client["branding"];
  }
): Promise<Client> {
  const clients = await getAllClients();
  const idx = clients.findIndex((c) => c.id === clientId);
  if (idx === -1) {
    throw new Error(`Client not found: ${clientId}`);
  }

  const current = clients[idx];
  const next: Client = {
    ...current,
    ...("displayName" in patch ? { displayName: patch.displayName ?? current.displayName } : {}),
    ...("email" in patch ? { email: patch.email } : {}),
    ...("isActive" in patch ? { isActive: patch.isActive ?? current.isActive } : {}),
    ...("payoutMode" in patch ? { payoutMode: patch.payoutMode ?? current.payoutMode } : {}),
    ...("branding" in patch ? { branding: patch.branding } : {}),
    // createdAt stays from current (never overwritten)
    createdAt: current.createdAt,
  };

  // Stripe accountId: set once, never overwrite
  const incomingAccountId = patch.stripe?.accountId?.trim();
  const existingAccountId = current.stripe?.accountId?.trim();

  if (existingAccountId) {
    next.stripe = { ...(next.stripe ?? {}), accountId: existingAccountId };
  } else if (incomingAccountId) {
    next.stripe = { ...(next.stripe ?? {}), accountId: incomingAccountId };
  } else if (current.stripe?.accountId || next.stripe?.accountId) {
    // keep whatever is already there (defensive)
    next.stripe = { ...(next.stripe ?? {}), accountId: current.stripe?.accountId };
  }

  clients[idx] = next;
  await writeJsonArray(CLIENTS_PATH, clients);

  return next;
}

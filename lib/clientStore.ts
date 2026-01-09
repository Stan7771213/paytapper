import { randomUUID } from "node:crypto";
import type { Client, NewClient } from "@/lib/types";
import { readJsonArray, writeJsonArray } from "@/lib/jsonStorage";

const CLIENTS_PATH = "clients.json";

export async function getAllClients(): Promise<Client[]> {
  return readJsonArray<Client>(CLIENTS_PATH);
}

export async function getClientByEmail(email: string): Promise<Client | null> {
  const clients = await getAllClients();
  const target = email.toLowerCase();
  return clients.find((c) => c.email?.toLowerCase() === target) ?? null;
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

    // Dashboard access token (set-once)
    dashboardToken: randomUUID(),
  };

  clients.push(client);
  await writeJsonArray(CLIENTS_PATH, clients);

  return client;
}

type UpdateClientPatch = {
  displayName?: string;
  email?: string;
  isActive?: boolean;
  payoutMode?: Client["payoutMode"];

  stripe?: { accountId?: string };

  // IMPORTANT: this is a PARTIAL patch; we merge into existing branding
  branding?: Client["branding"];

  emailEvents?: {
    welcomeSentAt?: string;
    stripeConnectedSentAt?: string;
  };

  passwordHash?: string;
  passwordReset?: {
    tokenHash: string;
    expiresAt: string;
  };
};

/**
 * Update a client deterministically.
 *
 * Rules:
 * - createdAt must never be overwritten
 * - ownerUserId must never be overwritten
 * - dashboardToken must NEVER be changed
 * - stripe.accountId must never be overwritten once set
 * - emailEvents timestamps are set-once (idempotent)
 * - branding must be MERGED (partial patch), never overwritten as a whole
 */
export async function updateClient(
  clientId: string,
  patch: UpdateClientPatch
): Promise<Client> {
  const clients = await getAllClients();
  const idx = clients.findIndex((c) => c.id === clientId);
  if (idx === -1) {
    throw new Error(`Client not found: ${clientId}`);
  }

  const current = clients[idx];

  // Start from current
  const next: Client = {
    ...current,

    // scalar fields (only if key present)
    ...("displayName" in patch
      ? { displayName: patch.displayName ?? current.displayName }
      : {}),
    ...("email" in patch ? { email: patch.email } : {}),
    ...("isActive" in patch
      ? { isActive: patch.isActive ?? current.isActive }
      : {}),
    ...("payoutMode" in patch
      ? { payoutMode: patch.payoutMode ?? current.payoutMode }
      : {}),

    // immutable fields
    createdAt: current.createdAt,
    dashboardToken: current.dashboardToken,
    ownerUserId: current.ownerUserId,

    // auth fields (explicit undefined means "clear" only if we pass it)
    ...(patch.passwordHash !== undefined
      ? { passwordHash: patch.passwordHash }
      : {}),
    ...(patch.passwordReset !== undefined
      ? { passwordReset: patch.passwordReset }
      : {}),
  };

  // Branding: MERGE partial patch into existing
  if ("branding" in patch) {
    if (patch.branding === undefined) {
      // explicit undefined => clear branding
      next.branding = undefined;
    } else {
      next.branding = {
        ...(current.branding ?? {}),
        ...patch.branding,
      };
    }
  }

  // Stripe accountId: set once, never overwrite
  const incomingAccountId = patch.stripe?.accountId?.trim();
  const existingAccountId = current.stripe?.accountId?.trim();

  if (existingAccountId) {
    next.stripe = { ...(next.stripe ?? {}), accountId: existingAccountId };
  } else if (incomingAccountId) {
    next.stripe = { ...(next.stripe ?? {}), accountId: incomingAccountId };
  } else if (current.stripe?.accountId || next.stripe?.accountId) {
    next.stripe = {
      ...(next.stripe ?? {}),
      accountId: current.stripe?.accountId,
    };
  }

  // Email events: timestamps are set-once
  if (patch.emailEvents) {
    next.emailEvents = {
      ...(current.emailEvents ?? {}),
      ...(patch.emailEvents.welcomeSentAt &&
      !current.emailEvents?.welcomeSentAt
        ? { welcomeSentAt: patch.emailEvents.welcomeSentAt }
        : {}),
      ...(patch.emailEvents.stripeConnectedSentAt &&
      !current.emailEvents?.stripeConnectedSentAt
        ? { stripeConnectedSentAt: patch.emailEvents.stripeConnectedSentAt }
        : {}),
    };
  }

  clients[idx] = next;
  await writeJsonArray(CLIENTS_PATH, clients);

  return next;
}

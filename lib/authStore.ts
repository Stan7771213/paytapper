import { readJsonArray, writeJsonArray } from "./jsonStorage";
import type { UserAuth } from "./types";

const AUTH_FILE = "auth.json";

export async function listAuth(): Promise<UserAuth[]> {
  return await readJsonArray<UserAuth>(AUTH_FILE);
}

export async function getAuthByEmail(email: string): Promise<UserAuth | null> {
  const normalized = email.trim().toLowerCase();
  const users = await readJsonArray<UserAuth>(AUTH_FILE);
  return users.find((u) => u.email === normalized) ?? null;
}

export async function getAuthById(id: string): Promise<UserAuth | null> {
  const users = await readJsonArray<UserAuth>(AUTH_FILE);
  return users.find((u) => u.id === id) ?? null;
}

export async function createAuth(auth: UserAuth): Promise<void> {
  const users = await readJsonArray<UserAuth>(AUTH_FILE);

  if (users.some((u) => u.email === auth.email)) {
    throw new Error("Auth with this email already exists");
  }

  users.push(auth);
  await writeJsonArray(AUTH_FILE, users);
}

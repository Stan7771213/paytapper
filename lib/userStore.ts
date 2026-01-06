import { randomUUID } from "node:crypto";
import type { User } from "@/lib/types";
import { readJsonArray, writeJsonArray } from "@/lib/jsonStorage";

const USERS_PATH = "users.json";

/**
 * Read all users.
 * Storage invariant: users.json is always a JSON array.
 */
export async function getAllUsers(): Promise<User[]> {
  return readJsonArray<User>(USERS_PATH);
}

/**
 * Get user by id.
 */
export async function getUserById(userId: string): Promise<User | null> {
  const users = await getAllUsers();
  return users.find((u) => u.id === userId) ?? null;
}

/**
 * Get user by email (case-insensitive).
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  const users = await getAllUsers();
  return users.find((u) => u.email === normalized) ?? null;
}

/**
 * Create a new user.
 *
 * Invariants:
 * - email must be unique
 * - passwordHash must be provided by caller
 * - createdAt is set once
 * - emailVerified defaults to false
 */
export async function createUser(input: {
  email: string;
  passwordHash: string;
}): Promise<User> {
  const email = input.email.trim().toLowerCase();
  if (!email) {
    throw new Error("Email is required");
  }
  if (!input.passwordHash) {
    throw new Error("passwordHash is required");
  }

  const users = await getAllUsers();

  const existing = users.find((u) => u.email === email);
  if (existing) {
    throw new Error("User with this email already exists");
  }

  const user: User = {
    id: randomUUID(),
    email,
    passwordHash: input.passwordHash,
    emailVerified: false,
    authProvider: "local",
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await writeJsonArray(USERS_PATH, users);

  return user;
}

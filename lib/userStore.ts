import { User } from "@/lib/types";
import { readJsonArray, writeJsonArray } from "@/lib/jsonStorage";

const USERS_FILE = "users.json";

async function readAll(): Promise<User[]> {
  return await readJsonArray<User>(USERS_FILE);
}

async function writeAll(users: User[]): Promise<void> {
  await writeJsonArray<User>(USERS_FILE, users);
}

export async function getUserById(userId: string): Promise<User | null> {
  const users = await readAll();
  return users.find((u) => u.id === userId) ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const lower = email.toLowerCase();
  const users = await readAll();
  return users.find((u) => u.email.toLowerCase() === lower) ?? null;
}

export async function createUser(user: User): Promise<void> {
  const users = await readAll();

  if (users.some((u) => u.id === user.id)) {
    throw new Error("User with this id already exists");
  }

  if (users.some((u) => u.email.toLowerCase() === user.email.toLowerCase())) {
    throw new Error("User with this email already exists");
  }

  await writeAll([...users, user]);
}

export async function updateUser(
  userId: string,
  updates: Partial<User>
): Promise<User> {
  const users = await readAll();
  const index = users.findIndex((u) => u.id === userId);

  if (index === -1) {
    throw new Error("User not found");
  }

  const updated: User = {
    ...users[index],
    ...updates,
  };

  const next = [...users];
  next[index] = updated;

  await writeAll(next);
  return updated;
}

export async function getUserByResetToken(
  token: string
): Promise<User | null> {
  const users = await readAll();
  return users.find((u) => u.passwordResetToken === token) ?? null;
}

export async function updateUserPassword(
  userId: string,
  passwordHash: string
): Promise<void> {
  const users = await readAll();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error("User not found");

  users[idx] = {
    ...users[idx],
    passwordHash,
    passwordResetToken: undefined,
    passwordResetExpiresAt: undefined,
    updatedAt: new Date().toISOString(),
  };

  await writeAll(users);
}

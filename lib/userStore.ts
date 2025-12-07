import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

export interface User {
  userId: string; // internal ID
  email: string;
  passwordHash: string;
  createdAt: string; // ISO
}

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const isProd = process.env.NODE_ENV === "production";

function ensureDataFile() {
  // In production on Vercel we don't create any files/directories
  if (isProd) return;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, "[]", "utf8");
  }
}

function readAllUsers(): User[] {
  try {
    if (!isProd) {
      // In dev ensure file exists
      ensureDataFile();
    }

    const raw = fs.readFileSync(USERS_FILE, "utf8");
    if (!raw.trim()) return [];
    return JSON.parse(raw) as User[];
  } catch {
    // If file not found or any error – assume no users
    return [];
  }
}

function writeAllUsers(users: User[]) {
  // No file writes in production
  if (isProd) return;

  ensureDataFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

export function findUserByEmail(email: string): User | undefined {
  const users = readAllUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(userId: string): User | undefined {
  const users = readAllUsers();
  return users.find((u) => u.userId === userId);
}

export async function createUser(params: {
  email: string;
  password: string;
}): Promise<User> {
  const existing = findUserByEmail(params.email);
  if (existing) {
    throw new Error("User with this email already exists");
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(params.password, saltRounds);

  const users = readAllUsers();

  const user: User = {
    userId: `user_${Date.now()}`,
    email: params.email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  writeAllUsers(users);

  return user;
}

export async function verifyUserPassword(params: {
  email: string;
  password: string;
}): Promise<User | null> {
  const user = findUserByEmail(params.email);
  if (!user) return null;

  const ok = await bcrypt.compare(params.password, user.passwordHash);
  if (!ok) return null;

  return user;
}


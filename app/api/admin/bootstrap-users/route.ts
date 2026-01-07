import { NextResponse } from "next/server";
import { readJsonArray, writeJsonArray } from "@/lib/jsonStorage";
import type { Client, User } from "@/lib/types";
import { randomUUID } from "node:crypto";

// SAFETY GUARD: allow only in Vercel runtime
function requireProd() {
  if (!process.env.VERCEL) {
    throw new Error("Not running on Vercel");
  }
}

const CLIENTS_PATH = "clients.json";
const USERS_PATH = "users.json";

export async function POST() {
  try {
    requireProd();

    const clients = await readJsonArray<Client>(CLIENTS_PATH);
    const users = await readJsonArray<User>(USERS_PATH);

    let created = 0;

    for (const client of clients) {
      if (!client.email) continue;

      const email = client.email.trim().toLowerCase();
      if (!email) continue;

      const existingUser = users.find((u) => u.email === email);
      if (existingUser) continue;

      const user: User = {
        id: randomUUID(),
        email,
        authProvider: "local",
        emailVerified: false,
        createdAt: new Date().toISOString(),
        // passwordHash intentionally undefined
      };

      users.push(user);
      created++;
    }

    if (created > 0) {
      await writeJsonArray(USERS_PATH, users);
    }

    return NextResponse.json({
      ok: true,
      usersCreated: created,
      totalUsers: users.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

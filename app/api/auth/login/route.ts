import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getUserByEmail } from "@/lib/userStore";
import { getClientByOwnerUserId } from "@/lib/clientStore";
import { setSession } from "@/lib/session"; // файл должен существовать в проекте

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body ?? {};

    if (!email || !password) {
      return json({ error: "Invalid credentials" }, 401);
    }

    // 1) Find user
    const user = await getUserByEmail(email);
    if (!user || !user.passwordHash) {
      // Do not reveal whether email exists
      return json({ error: "Invalid credentials" }, 401);
    }

    // 2) Verify password
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return json({ error: "Invalid credentials" }, 401);
    }

    // 3) Find client owned by user
    const client = await getClientByOwnerUserId(user.id);
    if (!client) {
      return json({ error: "Client not found for user" }, 500);
    }

    // 4) Create session
    await setSession(client.id);

    return json({ ok: true });
  } catch (err) {
    console.error("Login error:", err);
    return json({ error: "Internal error" }, 500);
  }
}

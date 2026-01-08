import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getUserByEmail } from "@/lib/userStore";
import { getClientByOwnerUserId } from "@/lib/clientStore";
import { createSession } from "@/lib/auth/sessions";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body ?? {};

    if (!email || !password) {
      return json({ error: "Invalid credentials" }, 401);
    }

    const user = await getUserByEmail(email);
    if (!user || !user.passwordHash) {
      return json({ error: "Invalid credentials" }, 401);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return json({ error: "Invalid credentials" }, 401);
    }

    const client = await getClientByOwnerUserId(user.id);
    if (!client) {
      return json({ error: "Client not found for user" }, 500);
    }

    await createSession(client.id);

    return json({ ok: true });
  } catch (err) {
    console.error("Login error:", err);
    return json({ error: "Internal error" }, 500);
  }
}

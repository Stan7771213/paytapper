import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getUserByEmail } from "@/lib/userStore";
import { getClientByOwnerUserId, createClient } from "@/lib/clientStore";
import { createSession } from "@/lib/auth/sessions";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body ?? {};

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return json({ error: "Invalid credentials" }, 401);
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await getUserByEmail(normalizedEmail);
    if (!user || !user.passwordHash) {
      return json({ error: "Invalid credentials" }, 401);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return json({ error: "Invalid credentials" }, 401);
    }

    let client = await getClientByOwnerUserId(user.id);

    // Self-heal: if an orphan user exists without a client, create the missing client once.
    if (!client) {
      console.warn("[login] client missing for user, creating one", {
        userId: user.id,
        email: user.email,
      });

      client = await createClient({
        ownerUserId: user.id,
        displayName: user.email,
        email: user.email,
        payoutMode: "direct",
      });
    }

    await createSession(client.id);

    return json({ ok: true });
  } catch (err) {
    console.error("Login error:", err);
    return json({ error: "Internal error" }, 500);
  }
}

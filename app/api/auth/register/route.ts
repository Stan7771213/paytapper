import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

import { createUser, getUserByEmail } from "@/lib/userStore";
import { createClient } from "@/lib/clientStore";
import { createSession } from "@/lib/auth/sessions";
import { sendWelcomeEmail } from "@/lib/email";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      displayName,
      email,
      password,
      passwordConfirm,
      payoutMode,
    } = body ?? {};

    // ---- Validation ----
    if (
      !email ||
      typeof email !== "string" ||
      !password ||
      typeof password !== "string" ||
      !passwordConfirm ||
      password !== passwordConfirm
    ) {
      return json({ error: "Invalid input" }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ---- Check existing user ----
    const existing = await getUserByEmail(normalizedEmail);
    if (existing) {
      return json({ error: "User with this email already exists" }, 409);
    }

    // ---- Create User ----
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = crypto.randomUUID();

    await createUser({
      id: userId,
      email: normalizedEmail,
      passwordHash,
      authProvider: "local",
      emailVerified: false,
      createdAt: new Date().toISOString(),
    });

    // ---- Create Client owned by User ----
    const client = await createClient({
      displayName: displayName || normalizedEmail,
      email: normalizedEmail,
      payoutMode: payoutMode === "platform" ? "platform" : "direct",
      ownerUserId: userId,
    });

    // ---- Create session (by clientId, v1.1) ----
    await createSession(client.id);

    // ---- Welcome email ----
    await sendWelcomeEmail({
      email: normalizedEmail,
      clientId: client.id,
      tipUrl: `/tip/${client.id}`,
      dashboardUrl: `/client/${client.id}/dashboard`,
    });

    return json({ ok: true });
  } catch (err) {
    console.error("[register]", err);
    return json({ error: "Internal error" }, 500);
  }
}

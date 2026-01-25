import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

import { createUser, getUserByEmail } from "@/lib/userStore";
import { createClient } from "@/lib/clientStore";
import { createSession } from "@/lib/auth/sessions";
import { sendClientWelcomeEmail } from "@/lib/email";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit && explicit.trim()) return explicit.trim().replace(/\/+$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim()) {
    const v = vercelUrl.trim().replace(/\/+$/, "");
    return v.startsWith("http") ? v : `https://${v}`;
  }

  return "http://localhost:3000";
}

function getMessageId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  if (!("id" in data)) return null;
  const id = (data as { id?: unknown }).id;
  return typeof id === "string" && id.trim() ? id : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { displayName, email, password, passwordConfirm, payoutMode } =
      body ?? {};

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

    // ---- Welcome email (best-effort; never blocks registration) ----
    const baseUrl = getBaseUrl();
    const tipUrl = `${baseUrl}/tip/${encodeURIComponent(client.id)}`;

    const emailRes = await sendClientWelcomeEmail({
      email: normalizedEmail,
      clientId: client.id,
      tipUrl,
      payoutMode: client.payoutMode,
    });

    if (!emailRes.success) {
      console.warn("[register] welcome email not sent", emailRes);
    } else {
      console.log("[register] welcome email sent", emailRes);
    }

    const messageId = emailRes.success ? getMessageId(emailRes.data) : null;

    return json({
      ok: true,
      email: {
        sent: emailRes.success,
        mode: emailRes.mode,
        message: emailRes.message,
        messageId,
      },
    });
  } catch (err) {
    console.error("[register]", err);
    return json({ error: "Internal error" }, 500);
  }
}

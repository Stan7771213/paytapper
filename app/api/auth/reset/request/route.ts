import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { readJsonArray, writeJsonArray } from "@/lib/jsonStorage";
import { sendPasswordResetEmail } from "@/lib/email";

const USERS_PATH = "users.json";
const RESET_TTL_SECONDS = 60 * 30; // 30 minutes

type UserWithReset = {
  id: string;
  email: string;
  passwordHash?: string;
  passwordReset?: {
    tokenHash: string;
    expiresAt: string;
  };
};

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit && explicit.trim()) return explicit.trim().replace(/\/+$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim()) {
    return vercelUrl.startsWith("http")
      ? vercelUrl
      : `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    // Security: always return ok
    if (!email) {
      return NextResponse.json({ ok: true });
    }

    const users = await readJsonArray<UserWithReset>(USERS_PATH);
    const user = users.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json({ ok: true });
    }

    const rawToken = crypto.randomUUID() + crypto.randomUUID();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + RESET_TTL_SECONDS * 1000
    ).toISOString();

    user.passwordReset = {
      tokenHash,
      expiresAt,
    };

    await writeJsonArray(USERS_PATH, users);

    const resetUrl = `${getBaseUrl()}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail({
      email,
      resetUrl,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405 }
  );
}

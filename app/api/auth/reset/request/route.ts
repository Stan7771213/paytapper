import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { readJsonArray, writeJsonArray } from "@/lib/jsonStorage";
import { sendPasswordResetEmail } from "@/lib/email";

const USERS_PATH = "users.json";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit && explicit.trim()) return explicit.trim();

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim()) {
    return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}

type UserWithReset = {
  id: string;
  email: string;
  passwordReset?: {
    tokenHash: string;
    expiresAt: string;
  };
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  // Do not reveal whether email exists
  if (!email) {
    return NextResponse.json({ ok: true });
  }

  const users = await readJsonArray<UserWithReset>(USERS_PATH);
  const user = users.find((u) => u.email === email);

  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = crypto.randomUUID();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

  user.passwordReset = { tokenHash, expiresAt };

  await writeJsonArray(USERS_PATH, users);

  const resetUrl = `${getBaseUrl()}/reset-password?token=${token}`;

  await sendPasswordResetEmail({ email, resetUrl });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

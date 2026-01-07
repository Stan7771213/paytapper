import { NextResponse } from "next/server";
import crypto from "crypto";
import { getClientByEmail, updateClient } from "@/lib/clientStore";
import { sendPasswordResetEmail } from "@/lib/email";

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

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const client = await getClientByEmail(email);

  // Do not reveal whether email exists
  if (!client) {
    return NextResponse.json({ ok: true });
  }

  const token = crypto.randomUUID();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h

  await updateClient(client.id, {
    passwordReset: {
      tokenHash,
      expiresAt,
    },
  });

  const resetUrl = `${getBaseUrl()}/reset/${token}`;

  await sendPasswordResetEmail({ email, resetUrl });

  return NextResponse.json({ ok: true });
}

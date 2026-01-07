import { NextRequest, NextResponse } from "next/server";

import { getUserByEmail } from "@/lib/userStore";
import { createPasswordResetToken } from "@/lib/passwordResetStore";
import { sendPasswordResetEmail } from "@/lib/email";

const RESET_TTL_SECONDS = 60 * 30; // 30 minutes

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

    // Security: never reveal whether email exists
    if (!email) {
      return NextResponse.json({ ok: true });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // 1) Create reset token (single source of truth)
    const { rawToken } = await createPasswordResetToken({
      userId: user.id,
      ttlSeconds: RESET_TTL_SECONDS,
    });

    // 2) Build reset URL
    const resetUrl = `${getBaseUrl()}/reset-password?token=${rawToken}`;

    // 3) Send email
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

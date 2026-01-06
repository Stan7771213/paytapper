import { NextRequest, NextResponse } from "next/server";

import { getUserByEmail } from "@/lib/userStore";
import { createPasswordResetToken } from "@/lib/passwordResetStore";
import { sendPasswordResetEmail } from "@/lib/email";

const RESET_TTL_SECONDS = 60 * 30; // 30 minutes

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const user = await getUserByEmail(email);

    // Security: do not reveal whether the email exists
    if (user) {
      const { rawToken } = await createPasswordResetToken({
        userId: user.id,
        ttlSeconds: RESET_TTL_SECONDS,
      });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

      await sendPasswordResetEmail({
        email,
        resetUrl,
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

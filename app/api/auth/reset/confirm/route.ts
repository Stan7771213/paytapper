import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { consumePasswordResetToken } from "@/lib/passwordResetStore";
import { updateUser } from "@/lib/userStore";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const token =
      typeof body?.token === "string" ? body.token.trim() : "";
    const newPassword =
      typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!token || newPassword.length < 8) {
      return json(
        { error: "Invalid token or password" },
        400
      );
    }

    // 1) Consume token (single source of truth)
    const { userId } = await consumePasswordResetToken({
      rawToken: token,
    });

    // 2) Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // 3) Update user password
    await updateUser(userId, { passwordHash });

    return json({ ok: true });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Invalid or expired token";
    return json({ error: message }, 400);
  }
}

export async function GET() {
  return json(
    { error: "Method Not Allowed" },
    405
  );
}

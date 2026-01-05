import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getUserByEmail, updateUser } from "@/lib/userStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const user = await getUserByEmail(email);

    if (user) {
      const token = randomUUID();
      const expiresAt = new Date(
        Date.now() + 1000 * 60 * 60 // 1 hour
      ).toISOString();

      await updateUser(user.id, {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
        updatedAt: new Date().toISOString(),
      });

      // TEMP v1: вместо email — логируем токен
      console.log("[RESET TOKEN]", email, token);
    }

    // Всегда отвечаем одинаково
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("reset/request error", err);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

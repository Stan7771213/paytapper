import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { consumePasswordResetToken } from "@/lib/passwordResetStore";
import { readJsonArray, writeJsonArray } from "@/lib/jsonStorage";
import type { User } from "@/lib/types";

const USERS_PATH = "users.json";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const token =
      typeof body.token === "string" ? body.token.trim() : "";
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Invalid token or password" },
        { status: 400 }
      );
    }

    // Consume token (validates + marks used)
    const { userId } = await consumePasswordResetToken({ rawToken: token });

    const users = await readJsonArray<User>(USERS_PATH);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    users[idx] = {
      ...users[idx],
      passwordHash,
    };

    await writeJsonArray(USERS_PATH, users);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

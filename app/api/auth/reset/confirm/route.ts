import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { readJsonArray, writeJsonArray } from "@/lib/jsonStorage";
import type { User } from "@/lib/types";

const USERS_PATH = "users.json";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const token =
    typeof body?.token === "string" ? body.token.trim() : "";
  const newPassword =
    typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!token || newPassword.length < 8) {
    return NextResponse.json(
      { error: "Invalid token or password" },
      { status: 400 }
    );
  }

  const tokenHash = hashToken(token);

  const users = await readJsonArray<User>(USERS_PATH);

  const user = users.find((u) => {
    const pr = u.passwordReset;
    if (!pr) return false;
    if (pr.tokenHash !== tokenHash) return false;
    if (Date.parse(pr.expiresAt) < Date.now()) return false;
    return true;
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 400 }
    );
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.passwordReset = undefined;

  await writeJsonArray(USERS_PATH, users);

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

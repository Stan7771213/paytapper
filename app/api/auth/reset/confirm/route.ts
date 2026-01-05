import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import {
  getUserByResetToken,
  updateUserPassword,
} from "@/lib/userStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const token = String(body.token ?? "");
    const password = String(body.password ?? "");
    const passwordConfirm = String(body.passwordConfirm ?? "");

    if (!token || !password || !passwordConfirm) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password too short" },
        { status: 400 }
      );
    }

    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    const user = await getUserByResetToken(token);
    if (!user || !user.passwordResetExpiresAt) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    if (new Date(user.passwordResetExpiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Token expired" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await updateUserPassword(user.id, passwordHash);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("reset/confirm error", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}

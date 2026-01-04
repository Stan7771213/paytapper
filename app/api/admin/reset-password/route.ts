import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, updateUser } from "@/lib/userStore";

/**
 * TEMPORARY ADMIN ROUTE
 * Purpose: one-time password recovery for existing user
 * MUST BE DELETED AFTER USE
 */

export async function POST(req: NextRequest) {
  const body = await req.json();

  const email = String(body.email || "").trim().toLowerCase();
  const passwordHash = String(body.passwordHash || "").trim();

  if (!email || !passwordHash) {
    return NextResponse.json(
      { error: "email and passwordHash are required" },
      { status: 400 }
    );
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  await updateUser({
    ...user,
    passwordHash,
  });

  return NextResponse.json({
    ok: true,
    message: "Password hash updated",
    userId: user.id,
  });
}

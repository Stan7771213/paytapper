import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

import { createUser, getUserByEmail } from "@/lib/userStore";
import { createClient } from "@/lib/clientStore";
import { setSession } from "@/lib/session";
import { sendClientWelcomeEmail } from "@/lib/email";
import { User } from "@/lib/types";

function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit && explicit.trim()) return explicit.trim().replace(/\/+$/, "");
  return "https://paytapper.net";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const passwordConfirm = String(body.passwordConfirm ?? "");

    if (!email || !password || !passwordConfirm) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password too short" }, { status: 400 });
    }

    if (password !== passwordConfirm) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user: User = {
      id: randomUUID(),
      email,
      passwordHash,
      authProvider: "local",
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };

    await createUser(user);

    const client = await createClient({
      displayName: email.split("@")[0],
      email,
      payoutMode: "direct",
      ownerUserId: user.id,
    });

    await setSession({
      userAuthId: user.id,
      clientId: client.id,
    });

    const baseUrl = getBaseUrl();
    const dashboardUrl = `${baseUrl}/client/${client.id}/dashboard`;
    const tipUrl = `${baseUrl}/pay/${client.id}`;

    // Welcome email (non-blocking)
    try {
      await sendClientWelcomeEmail({
        email,
        clientId: client.id,
        tipUrl,
        payoutMode: client.payoutMode,
      });
    } catch (err) {
      console.warn("Welcome email failed:", err);
    }

    return NextResponse.json(
      {
        clientId: client.id,
        redirect: dashboardUrl,
      },
      { status: 201 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

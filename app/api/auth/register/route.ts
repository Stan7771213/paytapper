import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { createUser } from "@/lib/userStore";
import { createClient } from "@/lib/clientStore";
import { setSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password =
      typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await createUser({
      email,
      passwordHash,
    });

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

    return NextResponse.json(
      {
        userId: user.id,
        clientId: client.id,
      },
      { status: 201 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

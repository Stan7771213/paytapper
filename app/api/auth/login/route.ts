import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getUserByEmail } from "@/lib/userStore";
import { getClientByOwnerUserId, getClientByEmail } from "@/lib/clientStore";
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

    const user = await getUserByEmail(email);
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const client = await getClientByEmail(user.email);

    if (!client) {
      return NextResponse.json(
        { error: "No client associated with this account" },
        { status: 401 }
      );
    }

    await setSession({
      userAuthId: user.id,
      clientId: client.id,
    });

    return NextResponse.json(
      {
        userId: user.id,
        clientId: client.id,
      },
      { status: 200 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

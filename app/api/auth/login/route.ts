import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getUserByEmail } from "@/lib/userStore";
import { getClientByOwnerUserId } from "@/lib/clientStore";
import { setSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user || user.authProvider !== "local" || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const client = await getClientByOwnerUserId(user.id);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 500 });
    }

    await setSession({
      userAuthId: user.id,
      clientId: client.id,
    });

    return NextResponse.json({ clientId: client.id }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

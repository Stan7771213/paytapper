import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getClientByEmail } from "@/lib/clientStore";
import { createSession } from "@/lib/auth/sessions";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password =
      typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return json({ error: "Invalid credentials" }, 401);
    }

    const client = await getClientByEmail(email);

    // Do not reveal whether email exists
    if (!client || !client.passwordHash) {
      return json({ error: "Invalid credentials" }, 401);
    }

    const ok = await bcrypt.compare(password, client.passwordHash);
    if (!ok) {
      return json({ error: "Invalid credentials" }, 401);
    }

    await createSession(client.id);

    return json({
      ok: true,
      clientId: client.id,
      dashboardUrl: `/client/${client.id}/dashboard`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return json({ error: message }, 500);
  }
}

// Explicitly block other methods
export async function GET() {
  return json({ error: "Method Not Allowed" }, 405);
}

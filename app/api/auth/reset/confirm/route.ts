import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAllClients, updateClient } from "@/lib/clientStore";
import bcrypt from "bcryptjs";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const newPassword =
      typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!token || newPassword.length < 8) {
      return json({ error: "Invalid token or password" }, 400);
    }

    const tokenHash = hashToken(token);
    const clients = await getAllClients();

    const client = clients.find((c) => {
      const pr = c.passwordReset;
      if (!pr) return false;
      if (pr.tokenHash !== tokenHash) return false;
      if (Date.parse(pr.expiresAt) < Date.now()) return false;
      return true;
    });

    if (!client) {
      return json({ error: "Invalid or expired token" }, 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await updateClient(client.id, {
      passwordHash,
      passwordReset: undefined,
    });

    return json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return json({ error: message }, 500);
  }
}

// Explicitly block other methods
export async function GET() {
  return json({ error: "Method Not Allowed" }, 405);
}

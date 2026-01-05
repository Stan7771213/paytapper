import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { createClient } from "@/lib/clientStore";
import { createSession } from "@/lib/auth/sessions";
import { sendWelcomeEmail } from "@/lib/email";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { displayName, email, password, payoutMode } = body ?? {};

    if (
      !displayName ||
      typeof displayName !== "string" ||
      !email ||
      typeof email !== "string" ||
      !password ||
      typeof password !== "string"
    ) {
      return json({ error: "Invalid input" }, 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // v1.1: ownerUserId = clientId (single-user model)
    const client = await createClient({
      displayName,
      email: email.toLowerCase(),
      payoutMode: payoutMode === "platform" ? "platform" : "direct",
      ownerUserId: crypto.randomUUID(),
    });

    // persist passwordHash (set-once)
    await import("@/lib/clientStore").then(({ updateClient }) =>
      updateClient(client.id, { passwordHash })
    );

    await createSession(client.id);

    await sendWelcomeEmail({
      email: client.email!,
      clientId: client.id,
      tipUrl: `/tip/${client.id}`,
      dashboardUrl: `/client/${client.id}/dashboard`,
    });

    return json({ ok: true });
  } catch (err) {
    console.error("[register]", err);
    return json({ error: "Internal error" }, 500);
  }
}

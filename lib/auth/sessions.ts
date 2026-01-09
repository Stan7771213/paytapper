import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE = "paytapper_session";
const SESSION_TTL_DAYS = 14;

export async function createSession(clientId: string): Promise<void> {
  if (!clientId) throw new Error("clientId required");

  const expiresAt = new Date(
    Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  const payload = JSON.stringify({
    clientId,
    exp: expiresAt.toISOString(),
    nonce: crypto.randomUUID(),
  });

  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: Buffer.from(payload).toString("base64url"),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function getSession(): Promise<{ clientId: string } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const data = JSON.parse(decoded) as {
      clientId?: string;
      exp?: string;
    };

    if (!data.clientId || !data.exp) return null;
    if (Date.parse(data.exp) < Date.now()) return null;

    return { clientId: data.clientId };
  } catch {
    return null;
  }
}

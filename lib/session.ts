import { cookies } from "next/headers";
import { createHmac, randomUUID } from "node:crypto";

const SESSION_COOKIE = "paytapper_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export async function setSession(clientId: string): Promise<void> {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + SESSION_TTL_SECONDS * 1000;

  const payload = JSON.stringify({
    v: 1,
    clientId,
    iat: issuedAt,
    exp: expiresAt,
    nonce: randomUUID(),
  });

  const value = `${Buffer.from(payload).toString("base64")}.${sign(payload)}`;

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

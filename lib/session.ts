import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "paytapper_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const SESSION_SECRET = process.env.SESSION_SECRET || "";

type SessionV2 = {
  v: 2;
  userAuthId: string;
  clientId: string;
  expiresAt: string;
};

export type SessionData = {
  userAuthId: string;
  clientId: string;
};

function requireSessionSecret() {
  if (!SESSION_SECRET.trim()) {
    throw new Error("SESSION_SECRET is not set");
  }
}

async function sign(payload: string): Promise<string> {
  requireSessionSecret();

  const enc = new TextEncoder();
  const keyData = enc.encode(SESSION_SECRET);
  const payloadData = enc.encode(payload);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, payloadData);
  return Buffer.from(signature).toString("base64");
}

async function encodeV2(session: SessionV2): Promise<string> {
  const payload = JSON.stringify(session);
  const payloadB64 = Buffer.from(payload).toString("base64");
  const signature = await sign(payload);
  return `${payloadB64}.${signature}`;
}

async function decodeV2(value: string): Promise<SessionV2 | null> {
  const parts = value.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const payload = Buffer.from(payloadB64, "base64").toString("utf8");

  const expected = await sign(payload);
  if (expected !== signature) return null;

  try {
    const parsed = JSON.parse(payload) as SessionV2;

    if (
      parsed.v !== 2 ||
      typeof parsed.userAuthId !== "string" ||
      typeof parsed.clientId !== "string" ||
      typeof parsed.expiresAt !== "string"
    ) {
      return null;
    }

    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function setSession(session: SessionData): Promise<void> {
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_SECONDS * 1000
  ).toISOString();

  const v2: SessionV2 = {
    v: 2,
    userAuthId: session.userAuthId,
    clientId: session.clientId,
    expiresAt,
  };

  const value = await encodeV2(v2);

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) return null;

  const v2 = await decodeV2(cookie.value);
  if (!v2) return null;

  return {
    userAuthId: v2.userAuthId,
    clientId: v2.clientId,
  };
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

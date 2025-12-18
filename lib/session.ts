import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "paytapper_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionData = {
  userAuthId: string;
  clientId: string;
};

export async function setSession(session: SessionData): Promise<void> {
  const value = JSON.stringify(session);

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

  try {
    const parsed = JSON.parse(cookie.value) as SessionData;

    if (
      typeof parsed.userAuthId !== "string" ||
      typeof parsed.clientId !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

import { NextRequest, NextResponse } from "next/server";

function unauthorizedResponse(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Tours Admin", charset="UTF-8"',
    },
  });
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function middleware(req: NextRequest) {
  const username = process.env.TOURS_ADMIN_USERNAME?.trim();
  const password = process.env.TOURS_ADMIN_PASSWORD?.trim();

  if (!username || !password) {
    return new NextResponse("Tours admin credentials are not configured.", {
      status: 503,
    });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  const encoded = authHeader.slice("Basic ".length).trim();

  let decoded = "";
  try {
    decoded = atob(encoded);
  } catch {
    return unauthorizedResponse();
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex < 0) {
    return unauthorizedResponse();
  }

  const providedUsername = decoded.slice(0, separatorIndex);
  const providedPassword = decoded.slice(separatorIndex + 1);

  const validUsername = timingSafeEqualStrings(providedUsername, username);
  const validPassword = timingSafeEqualStrings(providedPassword, password);

  if (!validUsername || !validPassword) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/tours/bookings", "/api/tours/bookings"],
};

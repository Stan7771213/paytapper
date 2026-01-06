import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/reset-password",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/tip/")) return true;
  if (pathname.startsWith("/api/auth/")) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const isProtectedPage = pathname.startsWith("/client/");
  const isProtectedApi = pathname.startsWith("/api/clients");

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const session = await getSession();

  if (!session) {
    if (isProtectedApi) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/client/:path*",
    "/api/clients",
  ],
};

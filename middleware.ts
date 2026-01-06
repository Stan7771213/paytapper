import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_req: NextRequest) {
  // TEMPORARY: auth middleware disabled (F3.1)
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};

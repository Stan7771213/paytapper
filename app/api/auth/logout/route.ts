import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/sessions";

export async function POST() {
  await destroySession();
  return NextResponse.json({ ok: true });
}

// Explicitly block other methods
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

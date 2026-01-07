import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      error: "Registration is disabled. Accounts are pre-provisioned.",
    },
    { status: 403 }
  );
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

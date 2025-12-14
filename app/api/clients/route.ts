// app/api/clients/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/clientStore";
import type { NewClient } from "@/lib/types";

function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit && explicit.trim()) return explicit.trim();

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim()) {
    const v = vercelUrl.trim();
    return v.startsWith("http") ? v : `https://${v}`;
  }

  return "http://localhost:3000";
}

type CreateClientBody = {
  displayName?: unknown;
  email?: unknown;
  payoutMode?: unknown;
};

function isPayoutMode(value: unknown): value is NewClient["payoutMode"] {
  return value === "direct" || value === "platform";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateClientBody;

    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim() : "";

    if (!displayName) {
      return NextResponse.json(
        { error: "displayName is required" },
        { status: 400 }
      );
    }

    if (!isPayoutMode(body.payoutMode)) {
      return NextResponse.json(
        { error: 'payoutMode must be "direct" or "platform"' },
        { status: 400 }
      );
    }

    const email =
      typeof body.email === "string" && body.email.trim()
        ? body.email.trim()
        : undefined;

    const client = await createClient({
      displayName,
      email,
      payoutMode: body.payoutMode,
    });

    const baseUrl = getBaseUrl();
    const tipUrl = `${baseUrl}/tip/${encodeURIComponent(client.id)}`;
    const dashboardUrl = `${baseUrl}/client/${encodeURIComponent(
      client.id
    )}/dashboard`;

    return NextResponse.json(
      {
        client,
        tipUrl,
        dashboardUrl,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


// app/api/stripe/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";

/**
 * Temporary stub for legacy Stripe Connect / account webhooks.
 *
 * Main payment webhooks (for tips/payments) are handled in:
 *   /app/api/webhook/route.ts
 *
 * This route exists only to keep backward compatibility with
 * old Stripe Dashboard webhook settings and to make the build pass.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    console.log(
      "🟨 [stub] Received call to /api/stripe/webhook. Body length:",
      body.length
    );

    return NextResponse.json(
      {
        message:
          "Legacy /api/stripe/webhook route is a stub. Use /api/webhook for payment events.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("🔴 Error in /api/stripe/webhook stub:", error);
    return NextResponse.json(
      { error: "Internal server error in stripe webhook stub." },
      { status: 500 }
    );
  }
}


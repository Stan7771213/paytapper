// app/api/connect/onboard/route.ts

import { NextRequest, NextResponse } from "next/server";

/**
 * Temporary stub for Stripe Connect onboarding.
 *
 * The real implementation will be added later.
 * For now we simply return 501 so that the route exists
 * and the build passes, but no actual Connect logic runs.
 */

export async function GET(_req: NextRequest) {
  return NextResponse.json(
    {
      error: "Stripe Connect onboarding is not implemented yet.",
    },
    { status: 501 }
  );
}

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      error: "Stripe Connect onboarding is not implemented yet.",
    },
    { status: 501 }
  );
}


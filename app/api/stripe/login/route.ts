// app/api/stripe/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { getClientById } from "@/lib/clientStore";

/**
 * POST /api/stripe/login
 *
 * Body: { clientId: string }
 *
 * If the client has a Stripe Connect account id, this route
 * returns a login link URL for the Stripe Express / Standard dashboard.
 *
 * For now this is a helper endpoint and will only work once
 * we actually store stripeAccountId on the client.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const clientId =
      typeof body.clientId === "string" ? body.clientId.trim() : "";

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const client = getClientById(clientId);

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    if (!client.stripeAccountId) {
      return NextResponse.json(
        {
          error:
            "Client does not have a Stripe Connect account yet (stripeAccountId is missing).",
        },
        { status: 400 }
      );
    }

    // At this point TypeScript knows stripeAccountId is a string
    const loginLink = await stripe.accounts.createLoginLink(
      client.stripeAccountId
    );

    return NextResponse.json(
      {
        url: loginLink.url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("🔴 Error in POST /api/stripe/login:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


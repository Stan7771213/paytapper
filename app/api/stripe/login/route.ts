import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getClientById } from "@/lib/clientStore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  try {
    const { clientId } = await req.json();

    if (!clientId) {
      return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
    }

    const client = getClientById(clientId);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const origin = req.headers.get("origin") || "https://www.paytapper.net";

    const loginLink = await stripe.accounts.createLoginLink(
      client.stripeAccountId,
      {
        redirect_url: `${origin}/dashboard`,
      }
    );

    return NextResponse.json({ url: loginLink.url });
  } catch (error: any) {
    console.error("Stripe login link error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create login link" },
      { status: 500 }
    );
  }
}


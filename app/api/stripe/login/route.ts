import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getClientById } from "@/lib/clientStore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      clientId?: string;
    };

    const clientId = body.clientId;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    // Ищем клиента в нашем хранилище
    const client: any = await getClientById(clientId);

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    if (!client.stripeAccountId) {
      return NextResponse.json(
        { error: "Stripe account is not connected yet" },
        { status: 400 }
      );
    }

    // Создаём login link для Stripe Express / Standard Dashboard
    const loginLink = await stripe.accounts.createLoginLink(
      client.stripeAccountId,
      {
        redirect_url: `${BASE_URL}/dashboard`,
      }
    );

    return NextResponse.json(
      { url: loginLink.url },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error in /api/stripe/login:", err);
    return NextResponse.json(
      {
        error:
          err?.message || "Internal server error in /api/stripe/login",
      },
      { status: 500 }
    );
  }
}


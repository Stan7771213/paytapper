import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getClientById } from "@/lib/clientStore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

    // ⚠️ Главное изменение: вызываем без redirect_url,
    // чтобы не конфликтовать с версией Stripe SDK на Vercel
    const loginLink = await stripe.accounts.createLoginLink(
      client.stripeAccountId
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


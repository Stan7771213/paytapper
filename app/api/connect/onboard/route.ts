import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  createClientIfNotExists,
  getClientById,
} from "@/lib/clientStore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { clientId, name, email } = body as {
      clientId?: string;
      name?: string;
      email?: string;
    };

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    // 1. Проверяем, есть ли клиент
    let existingClient = getClientById(clientId);

    let stripeAccountId: string;

    if (!existingClient) {
      // 2. Создаем Stripe аккаунт Standard
      const account = await stripe.accounts.create({
        type: "standard",
        email: email,
        business_type: "individual",
        metadata: { clientId },
      });

      stripeAccountId = account.id;

      // 3. Сохраняем клиента в JSON
      existingClient = createClientIfNotExists({
        clientId,
        stripeAccountId,
        name,
        email,
      });
    } else {
      stripeAccountId = existingClient.stripeAccountId;
    }

    // 4. Создаем ссылку на onboarding
    const refreshUrl = `${BASE_URL}/client/${encodeURIComponent(
      clientId
    )}/dashboard?onboarding=refresh`;

    const returnUrl = `${BASE_URL}/client/${encodeURIComponent(
      clientId
    )}/dashboard?onboarding=return`;

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err: any) {
    console.error("Error in /api/connect/onboard:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}


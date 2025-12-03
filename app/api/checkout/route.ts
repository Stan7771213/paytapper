import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.paytapper.net";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const amount = body?.amount;
    const guideId = body?.guideId as string | undefined;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid or missing amount" },
        { status: 400 }
      );
    }

    // metadata для Stripe (если guideId не передали, не добавляем вовсе)
    const metadata = guideId ? { guideId } : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Tip for guide",
            },
            // amount в центах, как и раньше
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/`,
      // 1) кладём guideId в metadata самой сессии
      metadata,
      // 2) и дополнительно в metadata payment_intent
      payment_intent_data: metadata ? { metadata } : undefined,
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);

    return NextResponse.json(
      {
        error: "Unable to create checkout session",
        details: error?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}


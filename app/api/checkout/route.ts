import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-11-17.clover",
});

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.paytapper.net";

// платформа забирает 10%, гиду идёт 90%
const PLATFORM_FEE_PERCENT = 10;

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

    // amount приходит в центах (100 = 1.00 EUR)
    const totalAmountCents = amount;

    const platformFeeCents = Math.round(
      (totalAmountCents * PLATFORM_FEE_PERCENT) / 100
    );
    const guideAmountCents = totalAmountCents - platformFeeCents;

    // всё в metadata кладём строками (Stripe этого требует)
    const metadata: Record<string, string> = {
      totalAmountCents: String(totalAmountCents),
      platformFeePercent: String(PLATFORM_FEE_PERCENT),
      platformFeeCents: String(platformFeeCents),
      guideAmountCents: String(guideAmountCents),
    };

    if (guideId) {
      metadata.guideId = guideId;
    }

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
            unit_amount: totalAmountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/`,
      // metadata у самой сессии
      metadata,
      // и у payment_intent
      payment_intent_data: {
        metadata,
      },
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


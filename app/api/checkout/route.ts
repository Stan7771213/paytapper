import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.paytapper.net";

// платформа забирает 10%, клиент получает 90%
const PLATFORM_FEE_PERCENT = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const amount = body.amount;
    const clientIdFromBody = body.clientId as string | undefined;
    const guideIdFromBody = body.guideId as string | undefined;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid or missing amount" },
        { status: 400 }
      );
    }

    // сумма приходит в центах (100 = 1.00 EUR)
    const totalAmountCents = amount;

    const platformFeeCents = Math.round(
      (totalAmountCents * PLATFORM_FEE_PERCENT) / 100
    );
    const clientAmountCents = totalAmountCents - platformFeeCents;

    const effectiveClientId =
      clientIdFromBody || guideIdFromBody || "unknown-client";

    // всё в metadata кладём строками (Stripe этого требует)
    const metadata: Record<string, string> = {
      totalAmountCents: String(totalAmountCents),
      platformFeePercent: String(PLATFORM_FEE_PERCENT),
      platformFeeCents: String(platformFeeCents),
      clientAmountCents: String(clientAmountCents),
      clientId: effectiveClientId,
    };

    // совместимость со старой логикой
    if (guideIdFromBody) {
      metadata.guideId = guideIdFromBody;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              // обновили название под платформу
              name: "Paytapper payment",
            },
            unit_amount: totalAmountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&clientId=${encodeURIComponent(
        effectiveClientId
      )}`,
      cancel_url: `${baseUrl}/cancel`,
      // metadata на уровне payment_intent
      payment_intent_data: {
        metadata,
      },
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err: any) {
    console.error("Error creating checkout session:", err);
    return NextResponse.json(
      {
        error: "Unable to create checkout session",
        details: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit && explicit.trim()) return explicit.trim();

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim()) {
    const v = vercelUrl.trim();
    return v.startsWith("http") ? v : `https://${v}`;
  }

  return "http://localhost:3000";
}

type CheckoutBody = {
  clientId?: unknown;
  amountCents?: unknown;
};

function isPositiveInt(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value > 0
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody;

    const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    if (!isPositiveInt(body.amountCents)) {
      return NextResponse.json(
        { error: "amountCents must be a positive integer" },
        { status: 400 }
      );
    }

    const amountCents = body.amountCents;
    const baseUrl = getBaseUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: "Paytapper payment" },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`,
      payment_intent_data: {
        // Webhook uses PaymentIntent metadata. Keep it minimal and non-placeholder.
        metadata: { clientId },
      },
    });

    return NextResponse.json({
      checkoutSessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    const details = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Unable to create checkout session", details },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { addPayment } from "@/lib/paymentStore";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return new NextResponse("Signature error", { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as any;

    await addPayment({
      id: intent.id,
      clientId: intent.metadata.clientId,
      amount: intent.amount_received,
      currency: intent.currency,
      createdAt: new Date().toISOString(),
      status: "succeeded",
    });
  }

  return NextResponse.json({ received: true });
}


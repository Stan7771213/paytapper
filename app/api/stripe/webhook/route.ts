import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getClientByStripeAccountId,
  updateClient,
} from "@/lib/clientStore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export const runtime = "nodejs"; // важно для Stripe

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Webhook secret not set");
    return new NextResponse("Webhook secret missing", { status: 500 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return new NextResponse(`Webhook error: ${err.message}`, { status: 400 });
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;

    const client = getClientByStripeAccountId(account.id);

    if (client) {
      const charges = account.charges_enabled || false;
      const payouts = account.payouts_enabled || false;

      let newStatus: "pending" | "active" | "restricted" = "pending";

      if (charges && payouts) {
        newStatus = "active";
      } else if (account.requirements?.disabled_reason) {
        newStatus = "restricted";
      }

      updateClient(client.clientId, {
        status: newStatus,
        chargesEnabled: charges,
        payoutsEnabled: payouts,
      });

      console.log(
        `Updated client ${client.clientId}: ${newStatus} (charges=${charges}, payouts=${payouts})`
      );
    }
  }

  return new NextResponse("OK", { status: 200 });
}


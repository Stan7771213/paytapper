import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

// Centralized Stripe instance for the whole app.
// ⚠️ DO NOT set apiVersion here, we rely on the SDK default.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


// TEMP DISABLED STRIPE
import Stripe from "stripe";
// TEMP DISABLED STRIPE

// TEMP DISABLED STRIPE
const apiKey = process.env.STRIPE_SECRET_KEY;
// TEMP DISABLED STRIPE
if (!apiKey) {
// TEMP DISABLED STRIPE
  throw new Error("Missing STRIPE_SECRET_KEY");
// TEMP DISABLED STRIPE
}
// TEMP DISABLED STRIPE

// TEMP DISABLED STRIPE
export const stripe = new Stripe(apiKey, {
// TEMP DISABLED STRIPE
  apiVersion: "2023-10-16",
// TEMP DISABLED STRIPE
});
// TEMP DISABLED STRIPE

// TEMP DISABLED STRIPE
export const stripeMode =
// TEMP DISABLED STRIPE
  apiKey.startsWith("sk_live_") ? "live" : "test";

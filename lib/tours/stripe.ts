import Stripe from "stripe";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value.trim();
}

const toursStripeSecretKey = requireEnv("TOURS_STRIPE_SECRET_KEY_TEST");

// IMPORTANT:
// We intentionally do NOT pin apiVersion.
// Stripe SDK default must be used to avoid SDK/version conflicts.
export const toursStripe = new Stripe(
  toursStripeSecretKey,
  {} as Stripe.StripeConfig
);

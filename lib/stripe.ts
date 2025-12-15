import Stripe from "stripe";

export type StripeMode = "test" | "live";

const STRIPE_MODE: StripeMode =
  (process.env.STRIPE_MODE as StripeMode | undefined) ?? "test";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function assertStripeEnv(mode: StripeMode): void {
  if (mode === "live") {
    requireEnv("STRIPE_SECRET_KEY_LIVE");
    requireEnv("STRIPE_WEBHOOK_SECRET_LIVE");
    return;
  }

  requireEnv("STRIPE_SECRET_KEY_TEST");
  requireEnv("STRIPE_WEBHOOK_SECRET_TEST");
}

function getStripeSecretKey(mode: StripeMode): string {
  return mode === "live"
    ? requireEnv("STRIPE_SECRET_KEY_LIVE")
    : requireEnv("STRIPE_SECRET_KEY_TEST");
}

// Fail fast at import-time (local + Vercel)
assertStripeEnv(STRIPE_MODE);

const stripeSecretKey = getStripeSecretKey(STRIPE_MODE);

export const stripe = new Stripe(stripeSecretKey);
export const stripeMode: StripeMode = STRIPE_MODE;
export const isLiveMode = STRIPE_MODE === "live";

import Stripe from "stripe";

export type StripeMode = "test" | "live";

const STRIPE_MODE: StripeMode =
  (process.env.STRIPE_MODE as StripeMode | undefined) ?? "test";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error("Missing required environment variable: " + name);
  }
  return value;
}

function getStripeSecretKey(mode: StripeMode): string {
  if (mode === "live") {
    return requireEnv("STRIPE_SECRET_KEY_LIVE");
  }
  return requireEnv("STRIPE_SECRET_KEY_TEST");
}

const stripeSecretKey = getStripeSecretKey(STRIPE_MODE);

export const stripe = new Stripe(stripeSecretKey);
export const stripeMode: StripeMode = STRIPE_MODE;
export const isLiveMode = STRIPE_MODE === "live";

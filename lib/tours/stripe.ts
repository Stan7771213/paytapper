import Stripe from "stripe";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value.trim();
}

function getToursStripeMode(): "test" | "live" {
  const raw = (process.env.TOURS_STRIPE_MODE ?? "test").trim().toLowerCase();
  if (raw === "test" || raw === "live") {
    return raw;
  }
  throw new Error(`Invalid TOURS_STRIPE_MODE: ${raw}`);
}

function getToursStripeSecretKey(): string {
  const mode = getToursStripeMode();
  if (mode === "live") {
    return requireEnv("TOURS_STRIPE_SECRET_KEY_LIVE");
  }
  return requireEnv("TOURS_STRIPE_SECRET_KEY_TEST");
}

const toursStripeSecretKey = getToursStripeSecretKey();

// IMPORTANT:
// We intentionally do NOT pin apiVersion.
// Stripe SDK default must be used to avoid SDK/version conflicts.
export const toursStripe = new Stripe(
  toursStripeSecretKey,
  {} as Stripe.StripeConfig
);

export const toursStripeMode = getToursStripeMode();

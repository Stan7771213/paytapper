import Stripe from "stripe";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(\`Missing required env var: \${name}\`);
  }
  return v.trim();
}

export const stripeMode = (process.env.STRIPE_MODE || "test") as "test" | "live";

let secretKey: string;

if (stripeMode === "live") {
  if (process.env.PAYTAPPER_LIVE_ACK !== "1") {
    throw new Error(
      "PAYTAPPER_LIVE_ACK=1 is required for live Stripe deployments"
    );
  }
  secretKey = requireEnv("STRIPE_SECRET_KEY_LIVE");
} else {
  secretKey = requireEnv("STRIPE_SECRET_KEY_TEST");
}

// IMPORTANT:
// We intentionally do NOT pin apiVersion.
// Stripe SDK default must be used to avoid SDK/version conflicts.
export const stripe = new Stripe(
  secretKey,
  {} as Stripe.StripeConfig
);

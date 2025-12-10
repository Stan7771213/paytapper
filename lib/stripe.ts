import Stripe from "stripe";

type StripeMode = "test" | "live";

const STRIPE_MODE: StripeMode =
  (process.env.STRIPE_MODE as StripeMode | undefined) ?? "test";

function getStripeSecretKey(): string {
  if (STRIPE_MODE === "live") {
    // Приоритет — live-ключи; fallback на старый STRIPE_SECRET_KEY,
    // чтобы ничего не сломать, пока мы не заполнили *_LIVE
    const liveKey =
      process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY;
    if (!liveKey) {
      throw new Error(
        "Stripe live secret key is not set. Please configure STRIPE_SECRET_KEY_LIVE or STRIPE_SECRET_KEY."
      );
    }
    return liveKey;
  } else {
    // TEST режим (по умолчанию)
    const testKey =
      process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY;
    if (!testKey) {
      throw new Error(
        "Stripe test secret key is not set. Please configure STRIPE_SECRET_KEY_TEST or STRIPE_SECRET_KEY."
      );
    }
    return testKey;
  }
}

const stripeSecretKey = getStripeSecretKey();

export const stripe = new Stripe(stripeSecretKey);

export const stripeMode: StripeMode = STRIPE_MODE;
export const isLiveMode = STRIPE_MODE === "live";


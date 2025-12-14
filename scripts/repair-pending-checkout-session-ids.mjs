import fs from "node:fs/promises";
import path from "node:path";
import Stripe from "stripe";

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error("Missing required environment variable: " + name);
  }
  return value.trim();
}

function getStripeSecretKey() {
  const mode = (process.env.STRIPE_MODE || "test").trim();

  if (mode === "live") {
    return requireEnv("STRIPE_SECRET_KEY_LIVE");
  }

  if (mode === "test") {
    return requireEnv("STRIPE_SECRET_KEY_TEST");
  }

  throw new Error('STRIPE_MODE must be "test" or "live"');
}

async function main() {
  const paymentsPath = path.join(process.cwd(), "data", "payments.json");

  const raw = await fs.readFile(paymentsPath, "utf8");
  const payments = JSON.parse(raw);

  if (!Array.isArray(payments)) {
    throw new Error("data/payments.json must be an array");
  }

  const stripe = new Stripe(getStripeSecretKey());

  let changed = 0;

  for (const p of payments) {
    const checkoutSessionId = p?.stripe?.checkoutSessionId;
    const paymentIntentId = p?.stripe?.paymentIntentId;

    if (checkoutSessionId !== "pending") continue;
    if (typeof paymentIntentId !== "string" || !paymentIntentId.trim()) continue;

    const list = await stripe.checkout.sessions.list({
      payment_intent: paymentIntentId,
      limit: 1,
    });

    const session = list.data[0];
    if (!session?.id) {
      console.warn(
        "[WARN] No Checkout Session found for paymentIntentId=" + paymentIntentId
      );
      continue;
    }

    p.stripe.checkoutSessionId = session.id;
    changed += 1;
    console.log(
      "[FIX] paymentIntentId=" +
        paymentIntentId +
        " -> checkoutSessionId=" +
        session.id
    );
  }

  if (changed === 0) {
    console.log("[OK] No pending checkoutSessionId values found.");
    return;
  }

  await fs.writeFile(
    paymentsPath,
    JSON.stringify(payments, null, 2) + "\n",
    "utf8"
  );
  console.log("[OK] Updated " + changed + " payment(s) in data/payments.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

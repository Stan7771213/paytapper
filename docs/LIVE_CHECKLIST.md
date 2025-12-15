# Paytapper — Live Launch Checklist (v1)

This checklist is the minimum set of steps to safely switch Paytapper from TEST to LIVE mode.

## 0) Preconditions
- `npm run build` is green locally.
- The latest commits are pushed to the `main` branch.
- `docs/ARCHITECTURE.md` is up to date.

## 1) Stripe Dashboard (LIVE)
- Confirm you are in **Live mode** in Stripe Dashboard.
- Verify you have:
  - Platform secret key (LIVE): `STRIPE_SECRET_KEY_LIVE`
  - Webhook signing secret (LIVE): `STRIPE_WEBHOOK_SECRET_LIVE`
- Confirm the Stripe API version in Dashboard matches what you expect for production usage.

## 2) Vercel Environment Variables (Production)
Set the following in Vercel **Production** environment:

Required:
- `STRIPE_MODE=live`
- `PAYTAPPER_LIVE_ACK=1`
- `STRIPE_SECRET_KEY_LIVE=...`
- `STRIPE_WEBHOOK_SECRET_LIVE=...`
- `BLOB_READ_WRITE_TOKEN=...`

Strongly recommended:
- `NEXT_PUBLIC_BASE_URL=https://paytapper.net` (or your canonical prod URL)

Notes:
- The app must fail fast if any required live variables are missing.
- Do not store live secrets in `.env.local` unless you fully understand the risk.

## 3) Stripe Webhook Endpoint (LIVE)
- Create or verify a Stripe webhook endpoint for production, pointing to:
  - `https://<YOUR_PROD_DOMAIN>/api/webhook`
- Subscribe at minimum to:
  - `payment_intent.succeeded`
- Copy the webhook signing secret into:
  - `STRIPE_WEBHOOK_SECRET_LIVE`

## 4) Base URL sanity checks
- Open the Client Dashboard in production:
  - Ensure it shows `Stripe mode: LIVE`.
- Ensure there is **no** test-mode warning banner on the dashboard.
- Open a public tip link and ensure there is **no** "Test payments" badge.

## 5) Live smoke test (one real payment)
Use a small amount (e.g. €1–€2) and do a complete end-to-end flow:

1. Create or pick one client.
2. Open `/tip/[clientId]` in production.
3. Complete a LIVE payment using a real payment method.
4. Verify `/success?session_id=...` shows:
   - Stripe mode badge = LIVE
   - A valid payment reference (PaymentIntent tail)
   - Gross/Fee/Net values (fee/net may appear after webhook persistence)
5. Verify `/client/[clientId]/dashboard` shows:
   - Stripe mode badge = LIVE
   - The payment appears in Recent payments
   - CSV export includes the payment

If the receipt shows "processing":
- Wait a few seconds and refresh the page.
- The persisted payment should appear once the webhook upsert completes.

## 6) Data storage sanity (Production)
- Confirm the platform has access to Blob storage:
  - `BLOB_READ_WRITE_TOKEN` must be valid.
- Confirm that payments are persisted and appear after webhook delivery.

## 7) Rollback plan (if something goes wrong)
If LIVE mode must be stopped quickly:
- Set `STRIPE_MODE=test` in Vercel Production env
- Remove or unset `PAYTAPPER_LIVE_ACK`
- Redeploy (or trigger a rebuild)

This prevents accidental live payments while you debug.

## 8) Post-launch monitoring (first 24 hours)
- Watch Vercel logs for:
  - Webhook signature errors
  - Missing env var errors (should never happen in live)
  - Storage read/write errors
- Watch Stripe events timeline for webhook delivery success.
- Verify at least one additional payment from a different device/network.


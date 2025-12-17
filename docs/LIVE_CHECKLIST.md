# Paytapper — Live Launch Checklist (v1)

This checklist is the minimum set of steps to safely switch Paytapper from TEST to LIVE mode.

## 0) Preconditions
- `npm run build` is green locally.
- The latest commits are pushed to the `main` branch.
- `docs/ARCHITECTURE.md` is up to date.
- If Stripe Connect is enabled (payoutMode="direct"), the Connect flows must be validated in TEST first.

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
Create or verify a Stripe webhook endpoint for production, pointing to:
- `https://<YOUR_PROD_DOMAIN>/api/webhook`

Subscribe at minimum to:
- `payment_intent.succeeded`

Recommended for monitoring Stripe Connect routing (v1):
- `transfer.created`
- `application_fee.created`

Notes:
- The app only requires `payment_intent.succeeded` to persist payments.
- The additional events are useful to confirm Connect routing and fee collection in the Stripe Timeline.

## 4) Stripe Connect readiness (LIVE)
Paytapper uses Stripe Connect Express (v1) for clients.

### 4.1 Platform account prerequisites
- Stripe Connect must be enabled on the platform account.
- Confirm you can create Express accounts in LIVE mode.
- Confirm you can access Stripe Connect settings and payout configuration.

### 4.2 Client prerequisites (for direct payouts)
For a client with `payoutMode="direct"`:
- The client must complete onboarding via Paytapper.
- The connected account must be considered connected by Paytapper:
  - `charges_enabled = true`
  - `details_submitted = true`

Rules:
- Paytapper must not store a "connected" boolean in JSON.
- Connection is derived from Stripe account retrieval on demand.

### 4.3 Operational warning
In LIVE mode, clients will be asked by Stripe to provide real information
(e.g., identity details and a bank account) to enable payouts.
This is expected and is required for real payouts.

## 5) Base URL sanity checks
- Open the Client Dashboard in production:
  - Ensure it shows `Stripe mode: LIVE`.
- Ensure there is **no** test-mode warning banner on the dashboard.
- Open a public tip link and ensure there is **no** "Test payments" badge.

## 6) Live smoke tests (payments)
Use small amounts (e.g. €1–€2) and do a complete end-to-end flow.

### 6.1 Smoke test — platform payout (baseline)
1. Create or pick one client.
2. Ensure client is not connected, or set `payoutMode="platform"`.
3. Open `/tip/[clientId]` in production.
4. Complete a LIVE payment using a real payment method.
5. Verify `/success?session_id=...` shows:
   - Stripe mode badge = LIVE
   - A valid payment reference (PaymentIntent tail)
   - Gross/Fee/Net values (fee/net may appear after webhook persistence)
6. Verify `/client/[clientId]/dashboard` shows:
   - Stripe mode badge = LIVE
   - The payment appears in Recent payments
   - CSV export includes the payment

### 6.2 Smoke test — Stripe Connect direct payout (v1)
1. Create or pick one client with `payoutMode="direct"`.
2. Complete Stripe Connect onboarding in LIVE mode via Paytapper.
3. Confirm the dashboard shows the client as Connected.
4. Complete a LIVE payment on `/tip/[clientId]`.
5. Verify Paytapper receipt and dashboard show the payment as PAID.
6. In Stripe Dashboard (platform account), confirm in the payment/event timeline:
   - An `application_fee_amount` was collected by the platform (10%).
   - A `transfer` was created to the connected account.

If Connect routing does not look correct:
- Do not accept more live payments for that client.
- Switch the client to `payoutMode="platform"` as a temporary operational fallback
  (until Connect routing is confirmed stable).

If the receipt shows "processing":
- Wait a few seconds and refresh the page.
- The persisted payment should appear once the webhook upsert completes.

## 7) Data storage sanity (Production)
- Confirm the platform has access to Blob storage:
  - `BLOB_READ_WRITE_TOKEN` must be valid.
- Confirm that payments are persisted and appear after webhook delivery.

## 8) Rollback plan (if something goes wrong)
If LIVE mode must be stopped quickly:
- Set `STRIPE_MODE=test` in Vercel Production env
- Remove or unset `PAYTAPPER_LIVE_ACK`
- Redeploy (or trigger a rebuild)

This prevents accidental live payments while you debug.

## 9) Post-launch monitoring (first 24 hours)
- Watch Vercel logs for:
  - Webhook signature errors
  - Missing env var errors (should never happen in live)
  - Storage read/write errors
  - Stripe API errors (Account retrieval, Checkout creation)
- Watch Stripe events timeline for webhook delivery success.
- For Connect clients, verify:
  - application fee creation
  - transfer creation
- Verify at least one additional payment from a different device/network.

---

## L2 — Live smoke test

Status: PASS ✅

- €1 LIVE payment completed successfully
- Stripe Checkout → Redirect → Webhook → Blob storage → Dashboard → CSV → Receipt
- Webhook delivery succeeded after redeploy
- Payment persisted with canonical paymentIntentId
- Receipt shows PAID with correct gross / fee / net

Example:
EUR 1.00 -> fee EUR 0.10 -> net EUR 0.90

# Paytapper — Architecture & Core Design

## Overview
Paytapper is a web platform for accepting tips and small payments via QR codes and personal links.
The product is built as a **client-centric platform** (guides, drivers, creators), not end-customers.

Core goals of the architecture:
- predictable behavior
- strict typing
- zero legacy ambiguity
- stable builds (local + Vercel)
- easy future extension (DB, auth, payouts, branding)

---

## Tech Stack
- Next.js 16 (App Router, Turbopack)
- TypeScript (strict mode, no `any`)
- Stripe (test + live)
- Resend (emails)
- Vercel (deployment)
- No database (JSON storage for now)

Production note (Vercel): the deployed filesystem is read-only (EROFS). Therefore production must use remote JSON storage (e.g. Vercel Blob) while keeping the same JSON format. Local development can use filesystem JSON.

---

## Project Principles
1. **Types first, logic second**
2. **One source of truth for domain models**
3. **No legacy fields**
4. **No silent fallbacks**
5. **No placeholders in persisted data**
6. **One small task → verification → next step**

---

## Source of Truth
All domain models are defined in:

`lib/types.ts`

No other file may redefine or extend domain types.

---

## Domain Models

### Client
Represents a person or entity receiving tips.

```ts
Client {
  id: string
  displayName: string
  email?: string
  isActive: boolean
  createdAt: string // Set only on first persistence; must never be overwritten on webhook re-delivery
  // Set only on first persistence; must never be overwritten on webhook re-delivery
  payoutMode: "direct" | "platform"

  stripe?: {
    accountId?: string
  }

  branding?: {
    title?: string
    description?: string
    avatarUrl?: string
  }

  emailEvents?: {
    welcomeSentAt?: string // ISO, set once when welcome email is sent
    stripeConnectedSentAt?: string // ISO, set once when "Stripe connected + QR" email is sent
  }
}
NewClient
Used when creating a client.
NewClient {
  displayName: string
  email?: string
  payoutMode: "direct" | "platform"
}
Payment
Represents a persisted payment record created/updated by the webhook.
Canonical identifier: stripe.paymentIntentId (required)
Payment {
  id: string
  clientId: string

  amountCents: number
  currency: "eur"

  platformFeeCents: number
  netAmountCents: number

  status: "created" | "paid" | "failed" | "refunded"

  Status semantics:
  - created: internal pre-final state, must be immediately resolved by webhook
  - paid: confirmed successful payment; paidAt must be set
  - failed: payment attempt failed (no funds captured)
  - refunded: funds were refunded after a successful payment

  Rules:
  - "pending" or placeholder states are strictly forbidden
  - persisted payments must always correspond to a real Stripe PaymentIntent
  - paidAt must be present if and only if status is "paid"

  stripe: {
    paymentIntentId: string   // canonical key
    checkoutSessionId: string // resolved deterministically
  }

  createdAt: string // Set only on first persistence; must never be overwritten on webhook re-delivery
  paidAt?: string

  payer?: {
    email?: string
    country?: string
  }
}
NewPayment
Used internally before persistence.
NewPayment {
  clientId: string
  amountCents: number
  currency: "eur"
}
Storage Layer

Backends
- Production: Vercel Blob via lib/jsonStorage.ts (requires env: BLOB_READ_WRITE_TOKEN)
- Local development: filesystem JSON (same logical format)

Logical files (not paths)
- clients.json — handled only by lib/clientStore.ts
- payments.json — handled only by lib/paymentStore.ts

Invariants
- All writes are async and must be awaited
- Payments are upserted by stripe.paymentIntentId (canonical key)
- createdAt is set on first persistence and never overwritten on re-delivery
- No placeholder values are ever persisted (e.g. "pending"); Stripe IDs must be real

Legacy
- data/ directory may exist locally but is not used in production

API Routes
Clients
POST /api/clients
Creates a client and returns:
clientId
tipUrl: /tip/{clientId}
dashboardUrl: /client/{clientId}/dashboard
Payments
Create Checkout Session
POST /api/payments/checkout
Responsibilities:
validate input (clientId, amount)
create Stripe Checkout Session
set minimal required metadata
Metadata rules:
required: clientId
must be a real existing clientId (validated server-side)
forbidden: placeholder values (e.g. "pending")
do not attempt to store checkoutSessionId in metadata (no post-create patching)
The system does not rely on metadata.checkoutSessionId at all.
Payments by Client
GET /api/payments/by-client?clientId=...
Returns all payments for dashboard statistics.

Payments export (CSV)
GET /api/payments/export.csv?clientId=...
Returns a CSV file as an attachment.
Rules:
- Server-side generation only (no client-side CSV assembly)
- Reads payments via lib/paymentStore.ts (same source as dashboard)
- No auth for now
- Fields (v1): date (paidAt ?? createdAt), status, grossEur, netEur, paymentIntentId
- Content-Type: text/csv; charset=utf-8
- Content-Disposition: attachment; filename="paytapper-payments-{clientId}.csv"
Stripe Connect
POST /api/connect/create
POST /api/connect/onboard
GET /api/connect/status
Used to connect a client’s Stripe account.
Webhook (Stripe)
POST /api/webhook
Listens to:
payment_intent.succeeded
(optionally: payment_intent.payment_failed, refunds later)
Responsibilities:
validate Stripe signature
extract paymentIntentId from the event (canonical key)
determine clientId:
prefer event.data.object.metadata.clientId if present
otherwise resolve it from the Checkout Session fetched by payment_intent (single source of truth)
deterministically resolve checkoutSessionId (single source of truth):
stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 })
calculate platform fee (10%) server-side
upsert payment via paymentStore using:
upsertPaymentByPaymentIntentId(paymentIntentId, data)
never persist placeholders; all persisted Stripe IDs must be real
## Public Pages & Routing (v1)

### `/` — Root (Landing / Entry Point)

The root page (`/`) is the primary public entry point of the product.

Behavior:
- If a valid session exists:
  - redirect to `/client/{clientId}/dashboard`
- If no session exists:
  - render the public landing page
  - provide CTA to `/register`
  - provide access to demo tip page

The root page is **not a placeholder** and is considered production-ready in v1.

---

### `/tip/{clientId}` — Tip Page

Public, no-auth page used by guests to send tips.

Special cases:
- `/tip/demo` — demo tip page used from the landing
- real payments only (no sandbox UI flows)

---

### `/register` / `/login`

Authentication entry points for clients (receivers of tips).

After successful auth:
- redirect to `/client/{clientId}/dashboard`


Client Dashboard
/client/[clientId]/dashboard
Displays:
QR code & payment link
Stripe connection status
payment statistics
recent payments
Stripe Configuration
Defined in:
lib/stripe.ts

Environment sanity guard (v1)
- lib/stripe.ts must validate Stripe env configuration at import-time and throw a clear Error on invalid configuration
- If STRIPE_MODE is "live": require STRIPE_SECRET_KEY_LIVE and STRIPE_WEBHOOK_SECRET_LIVE
- If STRIPE_MODE is "test" (default): require STRIPE_SECRET_KEY_TEST and STRIPE_WEBHOOK_SECRET_TEST
- No silent fallbacks; fail fast
- No changes to checkout or webhook logic

Live-mode deploy confirmation guard (v1)
- If STRIPE_MODE is "live", the app must require PAYTAPPER_LIVE_ACK=1 (explicit acknowledgement)
- If missing, lib/stripe.ts must throw a clear Error to prevent accidental live deployments


Modes
STRIPE_MODE = "test" | "live"
default = "test"

Live-mode readiness guardrails (v1)
- Client dashboard must render a visible Stripe mode badge: TEST or LIVE (server-rendered)
- If STRIPE_MODE is "test" and the resolved base URL does not look like localhost, the dashboard must show a warning to prevent accidental real-world sharing of test-mode links
- No new dependencies
- Must not change webhook or checkout logic

Keys
Test:
STRIPE_SECRET_KEY_TEST
STRIPE_WEBHOOK_SECRET_TEST
Live:
STRIPE_SECRET_KEY_LIVE
STRIPE_WEBHOOK_SECRET_LIVE
No legacy Stripe env vars are allowed. Use STRIPE_SECRET_KEY_TEST and STRIPE_SECRET_KEY_LIVE only, selected strictly via STRIPE_MODE.

Platform Fee
Fixed: 10%
defined once in backend logic
always calculated server-side
Deployment Rules
npm run build must pass locally
vercel build must pass before production deploy
no untyped fields allowed
no silent breaking changes
architecture changes: update this document first, then code
Current Development Focus
Core stability (test + live):
create client
open tip page
complete payment
webhook writes/updates payment deterministically (canonical paymentIntentId)
dashboard reflects payment
Only after this:
UI polishing
branding
auth
database migration
Non-Goals (for now)
Authentication
Multi-currency
Refunds
Invoices
Subscriptions
These will be added only after core stability.
Summary
Paytapper architecture prioritizes:
clarity
correctness
long-term maintainability
No feature is allowed to compromise these principles.


---

## Stripe Connect (v1) — Onboarding & Payout Routing

Goal: allow a client (guide/driver/creator) to connect their own Stripe account and receive payouts, while Paytapper collects a 10% platform fee.

### Concepts
- Platform Stripe account: Paytapper’s Stripe account (where the app is registered).
- Connected account: the client’s Stripe account created/linked via Stripe Connect.
- Payout modes:
  - direct: money goes to the connected account (client), platform keeps fee.
  - platform: money stays on platform account (v1 fallback / internal usage).

### Client model requirements
Client.stripe.accountId
- Must be set when onboarding starts (created or reused deterministically).
- Must never be overwritten once set.
- Stripe onboarding links must NEVER be stored (they are created on demand).
- Connection status / state is ALWAYS derived from Stripe API (not stored as a boolean or enum).

### Client Stripe State Machine (derived, v1)
We model Stripe connection as a derived state machine for UI + guardrails.

States:
- stripe: not_created
- stripe: onboarding
- stripe: restricted
- stripe: active

Derivation rules (server-side, from Stripe Account retrieval):
Input signals:
- hasAccountId: client.stripe.accountId exists
- chargesEnabled: account.charges_enabled
- detailsSubmitted: account.details_submitted
- requirementsDue: account.requirements.currently_due (array)
- requirementsPastDue: account.requirements.past_due (array)
- disabledReason: account.requirements.disabled_reason (string | null)

State derivation:
- not_created:
  - !hasAccountId
- onboarding:
  - hasAccountId AND detailsSubmitted == false
- restricted:
  - hasAccountId AND detailsSubmitted == true AND chargesEnabled == false
  - OR hasAccountId AND (len(requirementsPastDue) > 0 OR disabledReason is set)
- active:
  - hasAccountId AND detailsSubmitted == true AND chargesEnabled == true
Notes:
- We intentionally do NOT persist this state; it is computed on every status check.
- If Stripe retrieval fails, surface a clear error (no guesses).

### UI rules (must follow the derived state)
Dashboard:
- Show primary CTA “Connect Stripe” ONLY when state != active.
- Show Stripe status pill using the derived state:
  - not_created / onboarding / restricted / active.
- Show QR + tip link:
  - If payoutMode="direct": show QR only when state == active, otherwise show a disabled QR placeholder + explanation.
  - If payoutMode="platform": QR may be shown regardless of Stripe connect state (v1 fallback mode).

Tip page (/tip/[clientId]) payment guardrails:
- If client.payoutMode="direct" AND state != active:
  - Block checkout creation server-side with a clear 409-style error payload.
  - Tip page must render a simple message: “This creator is not ready to accept payments yet.”
- If payoutMode="platform":
  - Allow checkout as usual (v1 fallback).

### Email events (v1)
We send emails based on lifecycle events (idempotent policies apply per message-id / event key).

Events:
- welcome:
  - When a Client is created (POST /api/clients).
  - Content: “Account created” + CTA to dashboard + reminder to connect Stripe if payoutMode="direct".
- stripe reminder:
  - Triggered if payoutMode="direct" AND state in {not_created, onboarding, restricted}.
  - Delivery mechanism (v1): manual/cron later; architecture requires idempotency keys.
- stripe completed + QR:
  - Triggered when state transitions to active (derived by status check).
  - Content: “Stripe connected” + QR + tip link.
  - Rule: QR must not be sent before state == active.

### API routes (Connect)

POST /api/connect/create
Input:
- clientId (required)

Behavior:
1) Validate client exists.
2) If client.stripe.accountId is missing:
   - create a Stripe Connect account (type: "express" for v1) and persist accountId.
3) If accountId already exists: return it (idempotent).

Output (v1):
- { accountId: string }

POST /api/connect/onboard
Input:
- clientId (required)

Behavior:
1) Validate client exists.
2) Require client.stripe.accountId to exist.
   - If missing: return 409 with a clear error: "Stripe account not created yet".
3) Create an Account Link for onboarding / refresh / return.
4) Return a redirect URL to Stripe onboarding.

Output (v1):
- { url: string }

GET /api/connect/status?clientId=...
Behavior:
1) Validate client exists.
2) If no accountId: return connected=false.
3) Retrieve account from Stripe.
4) Return minimal status payload (v1):
- connected: boolean (chargesEnabled && detailsSubmitted)
- accountId: string
- chargesEnabled: boolean
- detailsSubmitted: boolean

Rules:
- Do not persist "connected" flags in JSON; always derive from Stripe retrieval.
- No silent fallbacks. If Stripe retrieval fails, surface a clear error.

### Payments routing (Connect)
Checkout creation (POST /api/payments/checkout) must route funds based on payoutMode:

If client.payoutMode = "direct" AND client.stripe.accountId is present AND account is connected:
- Create a Checkout Session that results in a PaymentIntent configured for Connect:
  - Collect platform fee (10%) via application_fee_amount
  - Route the remaining amount to the connected account via transfer_data.destination
- The canonical platform fee remains PLATFORM_FEE_PERCENT = 10 (server-side).

If client.payoutMode = "platform" OR client has no connected account:
- Create a standard Checkout Session on the platform account (no destination routing).

Rules:
- Webhook logic must remain canonical and stable:
  - Payments are persisted by stripe.paymentIntentId
  - clientId resolution stays deterministic (metadata.clientId preferred; otherwise via Session lookup)
- No placeholder states.

### Dashboard behavior
- If not connected: show "Not connected" and a single primary CTA to start onboarding.
- If connected: show "Connected" and allow opening Stripe Dashboard.
- Dashboard must show Stripe mode badge (TEST/LIVE).

### Non-goals for v1
- Full payout reconciliation
- Multiple connected accounts per client
- Refund routing edge cases
- KYC/verification guidance beyond Stripe-hosted UI


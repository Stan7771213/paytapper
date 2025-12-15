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
Frontend Pages
Landing
/
Marketing only. No core logic.
Tip Page
/tip/[clientId]
Customer-facing payment page.
fixed amounts
custom amount
Stripe Checkout redirect

Tip page guardrail (v1)
- If STRIPE_MODE is "test", the tip page must show a small, neutral server-rendered badge: "Test payments" (informational only)
- No warning banner here (dashboard handles warnings)
- No changes to checkout or webhook logic
Success Page
/success
Displayed after Stripe redirect.
Receipt (v1):
- Accepts Stripe Checkout query param: session_id
- Resolves paymentIntentId by retrieving the Checkout Session from Stripe
- Reads the persisted Payment record from JSON storage (paymentStore) using the canonical key (stripe.paymentIntentId)
- Optionally reads Client branding (clientStore) to display client name/avatar
- Displays: status, gross, fee, net, date, and a short payment reference
- If the Payment record is not found yet (webhook delay), falls back to Stripe session amount and shows a "processing" hint
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

# Paytapper — v1 COMPLETE

This document fixes the exact scope and guarantees of Paytapper v1.
Anything not listed here is NOT part of v1 by definition.

---

## Status

- v1: COMPLETE
- Build: green (local + Vercel)
- Stripe: TEST fully verified end-to-end
- Architecture: stable, documented, enforced

---

## Core Guarantees (v1)

### Payments
- Stripe Checkout (TEST + LIVE ready)
- Canonical identifier: stripe.paymentIntentId
- Webhook-driven persistence (idempotent)
- No placeholder or pending states
- Platform fee: fixed 10%, server-side only
- CSV export available

### Clients
- One client = one permanent clientId
- One permanent QR per client
- QR is deterministic and never stored
- QR encodes: https://paytapper.net/tip/{clientId}

### Dashboard
- Auth-protected (email + password)
- Stripe connect lifecycle (Express)
- Stripe mode badge (TEST / LIVE)
- TEST-mode warning on non-localhost
- Payments summary (derived)
- Recent payments list
- CSV export
- Logout

### Emails
- Welcome email (sent once, idempotent)
- Stripe connected + QR email (sent once, idempotent)
- Emails are state-driven, never click-driven
- Email idempotency enforced via timestamps

### Auth (v1)
- Email + password
- One user → one client
- Cookie-based session
- No magic links, no reset, no verification

### Storage
- JSON storage via lib/jsonStorage.ts
- Local FS for dev
- Vercel Blob for prod
- No database dependency

### Stripe Safety
- Strict STRIPE_MODE (test / live)
- Live deploy requires PAYTAPPER_LIVE_ACK=1
- No silent fallbacks
- Stripe env validated at import-time

---

## Explicit Non-Goals (v1)

- Password reset
- Email verification
- Roles / teams
- Multi-currency
- Refund handling UI
- Analytics / tracking
- Admin panel
- Client deletion
- QR rotation
- Webhooks beyond payment_intent.succeeded

---

## Entry Points (v1)

- /
- /register
- /login
- /client/{clientId}/dashboard
- /tip/{clientId}
- /success

---

## Readiness

Paytapper v1 is:
- safe to run in TEST
- safe to switch to LIVE after checklist
- safe to extend incrementally

Next steps must NOT break v1 guarantees.

---

## Signed

Architecture-first.
No legacy.
No shortcuts.

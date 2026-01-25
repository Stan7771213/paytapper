# Paytapper — Architecture & Core Design

## Overview
Paytapper is a QR-based tipping & micro-payments product. Service professionals (waiters, bartenders, guides, drivers, creators) create a Paytapper account, connect Stripe (Connect Standard), then share a personal tip link/QR.

**Money never sits in Paytapper.** Payments are processed by Stripe and go directly to the client’s Stripe account (Connect Standard).

Core goals:
- strict typing / predictable behavior
- idempotency & deterministic storage
- no legacy ambiguity / no silent fallbacks
- stable builds (local + Vercel)

---

## Tech stack
- Next.js 16 (App Router)
- TypeScript (strict)
- Stripe (Checkout + Connect Standard)
- Resend (transactional email)
- Vercel (hosting)
- Storage: JSON (no DB yet)
  - Production: Vercel Blob for JSON
  - Local dev: filesystem JSON

---

## Project principles
1. **Types first.** Domain models live only in `lib/types.ts`.
2. **No silent success.** If an integration is disabled (missing env), it must be explicit.
3. **Deterministic updates.** No random overwrites of immutable fields.
4. **No placeholders.** No fake states like "pending" in persisted data.
5. **One step → verify → next.**

---

## Source of truth
### Domain types
All domain types are defined in:
- `lib/types.ts`

No other file may redefine or extend them.

---

## Domain models (v1.1)

### User
Represents an authenticated account.

Key rules:
- `email` is canonical for login lookup (normalized to lowercase + trimmed).
- `createdAt` is set once.

### Client
Represents a tip receiver profile owned by a user.

Key rules:
- `ownerUserId` is immutable.
- `createdAt` is immutable.
- `dashboardToken` is **set-once** (legacy / links, if used) and must never change.
- `stripe.accountId` is **set-once** (never overwrite once set).
- `branding` is **merged** (partial patch) and never overwritten as a whole.
- `emailEvents.*SentAt` timestamps are **set-once**.

### Payment
Represents a persisted payment record.

Key rules:
- Canonical key is `stripe.paymentIntentId`.
- Storage is an upsert by `paymentIntentId`.
- `createdAt` is immutable.
- `paidAt` exists **iff** status is `paid`.
- No placeholder statuses.

---

## Storage
### JSON storage backends
- Local dev: filesystem JSON (inside project directory)
- Production: Vercel Blob JSON (requires `BLOB_READ_WRITE_TOKEN`)

### Logical JSON files
- `users.json` — handled only by `lib/userStore.ts`
- `clients.json` — handled only by `lib/clientStore.ts`
- `payments.json` — handled only by `lib/paymentStore.ts`

Invariants:
- all writes are awaited
- deterministic read/modify/write
- canonical identifiers are never changed

---

## Auth & sessions
- Session is the source of truth for dashboard access.
- `session.clientId` is canonical and must match `/client/{clientId}`; otherwise redirect.
- Session cookie is HttpOnly.

---

## Stripe
### Stripe Checkout
- Tip flow creates a Checkout Session for a given `clientId` and amount.

### Stripe Connect (Standard)
- Each client connects their own Stripe account.
- Paytapper provides onboarding + dashboard login links.

### Webhook
- Persists payments deterministically using `payment_intent` events.
- Must verify signature.

---

## Emails (Resend)
- Provider: Resend
- From: `Paytapper <no-reply@paytapper.net>`
- No silent success when disabled.

Primary transactional events:
- Welcome email after registration
- Stripe connected email when derived Connect state becomes active
- Password reset email on reset request
- Feedback email on `/api/feedback`

See EMAILS.md.

---

## Uploads
- Avatar upload implemented via `/api/uploads/avatar`.
- Stored as public URL and written into `client.branding.avatarUrl`.

See UPLOADS.md.

---

## UI modules (important)
### Landing
- `/` is public, English, includes CTA + FAQ v1.

### Dashboard
- `/client/{clientId}/dashboard`
- Stripe section is split:
  - Not connected: Connect Stripe + helper text (website field guidance)
  - Connected: explanation + Open Stripe dashboard
- Tip link & QR section includes share tools:
  - optional message
  - copy link / copy message+link
  - WhatsApp prefill link
  - download QR PNG

### Tip page
- `/tip/{clientId}` renders avatar + branding for payer trust.

---

## Known non-goals (current phase)
- No marketing email campaigns
- No multi-language
- No paid storage/CDN optimizations yet

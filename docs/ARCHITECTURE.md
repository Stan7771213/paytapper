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

## Domain models (v1.2)

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

### TourBooking
Represents a persisted paid tour booking inside the tours flow that is hosted in this repository.

Key rules:
- Canonical key is `stripe.paymentIntentId`.
- Storage is an upsert by `paymentIntentId`.
- `createdAt` is immutable.
- `paidAt` is set once payment is confirmed.
- `confirmationEmailsSentAt` is set after successful booking email delivery.
- `octo` data is optional because not all tours use CaptainBook / OCTO.
- Group tours and local/private tours share one booking model.

---

## Storage
### JSON storage backends
- Local dev: filesystem JSON (inside project directory)
- Production: Vercel Blob JSON (requires `BLOB_READ_WRITE_TOKEN`)

### Logical JSON files
- `users.json` — handled only by `lib/userStore.ts`
- `clients.json` — handled only by `lib/clientStore.ts`
- `payments.json` — handled only by `lib/paymentStore.ts`
- `tour_bookings.json` — handled only by `lib/tours/bookingStore.ts`

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
- Tour booking confirmation / notification emails for tour bookings

Tour booking emails currently go to:
- customer email
- `TOURS_INTERNAL_NOTIFICATION_EMAIL`
- `TOURS_OPERATOR_NOTIFICATION_EMAIL`

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

### Tours pages
- Tour sales pages are hosted inside this repository as a separate flow from Paytapper tipping.
- These pages use the project as payment / storage / email infrastructure.
- Tip flow and tour flow are separate logical products sharing one codebase.

---

## Tours architecture (St Tour inside this repo)

### Purpose
This repository now also hosts QR-based tour sales pages used by the St Tour project.

This does **not** change the core identity of Paytapper:
- Paytapper remains a separate QR tips product
- tour sales are an additional flow built on the same technical base

### Current tour routes
- `/tours/tallinn-old-town` — group walking tour
- `/tours/tallinn-old-town-private` — private walking tour
- `/tours/success`
- `/tours/cancel`
- `/tours/bookings`
- `/api/tours/availability`
- `/api/tours/checkout`
- `/api/tours/webhook`
- `/api/tours/bookings`

### Multi-tour foundation
Tour pages are no longer hardcoded as one single OCTO/CaptainBook product.

The system now supports multiple tour products through shared product configuration and shared UI.

Tour products are defined in:
- `lib/tours/config.ts`

Shared tour types are defined in:
- `lib/tours/types.ts`

### Tour product modes
Each tour product now has two independent axes:

#### Availability mode
- `octo` — availability comes from CaptainBook / OCTO
- `local` — availability is computed locally from our own rules + paid bookings

#### Pricing mode
- `perPayableGuest` — total depends on payable guest count
- `privateTiered` — total depends on group size tier, not per-person multiplication

This architecture is intentionally designed so future tours can be added without rewriting the full booking flow.

Examples:
- group tour → `octo` + `perPayableGuest`
- private tour → `local` + `privateTiered`
- future food tour can reuse either mode or a new combination

### Group tour flow
Current group tour:
- Product: `tallinn-old-town`
- Route: `/tours/tallinn-old-town`

Behavior:
- availability is loaded live from CaptainBook via OCTO
- selected slot is checked again in checkout
- hold is created in OCTO before Stripe Checkout
- after successful payment, webhook confirms booking in OCTO
- booking is saved locally
- emails are sent
- booking appears in CaptainBook

Current UI behavior for group tour:
- available slots show remaining places left
- page explains that groups are usually up to 17 people; for larger groups, 2–3 guides are assigned

### Private tour flow
Current private tour:
- Product: `tallinn-old-town-private`
- Route: `/tours/tallinn-old-town-private`

Behavior:
- no CaptainBook / OCTO integration
- availability is computed locally
- one booking currently blocks the date according to configured rules
- payment goes through tours Stripe
- after successful payment, webhook stores booking locally and sends emails
- slot becomes unavailable based on persisted paid booking

Current pricing:
- €150 for 1–4 guests
- €200 for 5–15 guests

Current availability rules:
- default slot: `16:00`
- default cutoff: 180 minutes before start
- currently one private booking per day / slot
- today becomes unavailable once cutoff is reached

### Local tour rules
Local tour behavior is designed to be extendable.

Current rule layer lives in:
- `lib/tours/localRules.ts`

It is intended to support:
- manually closed dates
- manually closed slots
- cutoff overrides for specific dates / times
- future additional scheduling logic

This foundation was added specifically so future private tours or other local tours do not require architectural rewrite.

### Availability providers
Availability is now routed through a mixed provider:

- `OctoAvailabilityProvider`
- `LocalAvailabilityProvider`
- `MixedAvailabilityProvider`

Entry point:
- `lib/tours/availability.ts`

This preserves the existing CaptainBook group flow while allowing non-OCTO tours to coexist.

### Checkout behavior
Tour checkout is handled by:
- `app/api/tours/checkout/route.ts`

Behavior:
- validates selected tour product
- validates date/time/party size
- resolves pricing according to product pricing mode
- resolves availability according to product availability mode
- creates OCTO hold only for OCTO products
- creates Stripe Checkout for both OCTO and local tours
- stores all relevant metadata in Stripe metadata for webhook use

### Tours webhook behavior
Tour webhook is handled by:
- `app/api/tours/webhook/route.ts`

Behavior:
- processes `payment_intent.succeeded`
- resolves tour product from metadata
- for OCTO tours: confirms booking in OCTO
- for local tours: skips OCTO confirmation
- persists booking into `tour_bookings.json`
- sends booking emails
- marks `confirmationEmailsSentAt` after successful send

### Tours admin page
- `/tours/bookings`
- `/api/tours/bookings`

Protected by Basic Auth:
- `TOURS_ADMIN_USERNAME`
- `TOURS_ADMIN_PASSWORD`

### Tours Stripe separation
Tours use a dedicated Stripe configuration separate from Paytapper core tipping logic.

Important principle:
- Paytapper tip flows and tour sales flows must remain logically separated
- changes to tours must not break tips product behavior

### Current known limitations
- meeting point image path currently needs cleanup if missing asset is deployed
- local manual rules UI does not yet exist; rules are code-configured
- refunds / cancellations / admin operational actions are not yet implemented for local/private tours
- future guide/resource conflict logic is not implemented yet
- future multi-slot private scheduling is supported architecturally but not yet exposed in UI

---

## Known non-goals (current phase)
- No marketing email campaigns
- No multi-language
- No paid storage/CDN optimizations yet

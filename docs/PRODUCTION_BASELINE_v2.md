# Paytapper — Production Baseline v2

## Status

This document fixes the **production-ready baseline** for Paytapper v1.
All items below are consciously accepted decisions.
Any change to runtime behavior must update this document first.

---

## Environment

### Runtime

* Next.js App Router
* Node.js runtime for all API routes using:

  * Stripe
  * Vercel Blob
  * multipart/form-data

Edge runtime is **not used** for any route that:

* parses files
* uses crypto
* touches payments or identity

---

## Stripe

### Mode

* Stripe TEST or LIVE is controlled exclusively by environment variables.
* UI shows explicit TEST / LIVE badge.
* TEST mode on non-localhost URLs shows a warning banner.

### Payment Flow

* Tip page → Stripe Checkout redirect
* No inline payments
* No client-side Stripe secrets
* All payment intents created server-side

---

## Identity Model

### Client vs User

* **User**: authentication & ownership only
* **Client**: public-facing entity (tips, branding, avatar)

Payments, branding, QR codes are always associated with **Client**, not User.

---

## Tip Page Architecture

### Server Responsibilities

* Load Client
* Resolve branding:

  * title
  * description
  * avatarUrl
* Render identity (name, avatar, description)

### Client Responsibilities

* Payment UI only
* Amount selection
* Redirect to Stripe Checkout

Client components do **not** resolve identity.

---

## Avatar Upload

### Storage

* Vercel Blob
* Deterministic path:

  * `avatars/{clientId}.{ext}`
* Public URL
* Overwrite allowed
* No random suffixes

### Validation

* Allowed MIME types:

  * image/jpeg
  * image/png
  * image/webp
* Max size: 2 MB
* Validation enforced server-side

### Ownership

* Upload allowed only if:

  * valid session
  * session.clientId matches target client
  * session.userAuthId matches client.ownerUserId

### Known Trade-offs (Accepted)

* If avatar MIME type changes, old blob file may remain unused.
* No image resizing or transformation in v1.
* No avatar history.

---

## Avatar Upload UX

### Current Strategy (v1)

* Client-side upload via multipart/form-data
* On success: `window.location.reload()`

### Rationale

* Guarantees fresh server-rendered data
* Avoids cache invalidation complexity
* Acceptable UX cost for MVP

This is **intentional**, not accidental.

---

## Rate Limiting

### Current State

* No explicit rate limiting on avatar upload in v1.

### Rationale

* Deterministic blob overwrite prevents storage abuse
* Endpoint is authenticated and ownership-protected

### Planned

* Soft rate limit (e.g. per-session) in v2

---

## Email

### Provider

* Resend

### Rules

* If `RESEND_API_KEY` is missing:

  * email sending is disabled
  * no silent fallbacks
  * no fake success

---

## Storage

### JSON Storage

* Used for:

  * clients
  * payments
* Deterministic reads & writes
* No in-memory state
* Safe for low-concurrency MVP

---

## Deployment Rules

### Required Before Deploy

* `npm run build` passes
* Stripe mode explicitly confirmed
* Environment variables set:

  * STRIPE_SECRET_KEY
  * STRIPE_WEBHOOK_SECRET
  * BLOB_READ_WRITE_TOKEN
  * RESEND_API_KEY (optional)

### Forbidden

* Deploying without updating this document
* Hotfixes without baseline update
* Client-side identity resolution

---

## Scope

This baseline applies to:

* Paytapper v1
* Single-client-per-user model
* Stripe Checkout payments
* Avatar + QR-based tipping

Anything outside this scope requires a new baseline version.


# Paytapper — Product Flow v1

## Purpose
This document defines the canonical user, auth, Stripe, QR, and email flows
for Paytapper v1.

Its goal is to:
- prevent duplicate accounts
- prevent duplicate emails
- guarantee predictable UX
- ensure idempotency of all side-effects
- align frontend, backend, and emails around one mental model

This document is mandatory for implementation.

---

## 1. Core Concept

Paytapper is an account-based service.

A user:
- registers once
- owns exactly one Client account
- logs in repeatedly
- uses the same QR code permanently

No action in the UI should ever create a new Client after registration.

---

## 2. Entry Points

### / — Landing page
Purpose: marketing + access to the product.

Contains:
- Button: Register
- Button: Login

Must NOT:
- create Client
- send emails
- touch Stripe

---

## 3. Registration (v1)

### UI
Route: /register

Fields:
- email (required, unique)
- password (required)

UX rules:
- submit button has loading state
- button becomes disabled after first click
- double click MUST NOT create duplicates
- clear error messages

---

### Backend behavior

Endpoint example:
POST /api/auth/register

Logic:
1. Check if email already exists
2. If exists → return error
3. Create exactly ONE Client
4. Hash password
5. Create auth session
6. Trigger Welcome email (idempotent)

Idempotency:
- email is the unique key
- repeated requests must not create new Client

---

## 4. Login (v1)

### UI
Route: /login

Fields:
- email
- password

Result:
- session cookie
- redirect to dashboard

---

## 5. Auth Model (v1)

- User identity is derived from auth session
- clientId is resolved server-side
- direct access to /client/{id}/dashboard without session is forbidden

Dashboard is never entered by URL guessing.

---

## 6. Dashboard Lifecycle

Route:
/client/{clientId}/dashboard

Dashboard:
- never creates Client
- never sends welcome email
- never sends Stripe emails
- only reflects state and exposes actions

---

## 7. Stripe Onboarding (direct mode)

Button: Connect Stripe

Rules:
- button has loading + disabled state
- double click is ignored
- onboarding link is NEVER stored

Flow:
1. Create or reuse Stripe accountId
2. Generate onboarding link
3. Redirect user to Stripe

---

## 8. Stripe Return

After Stripe return:
- dashboard reloads
- Stripe state is derived from Stripe API
- no state is persisted locally

If state becomes active:
- QR becomes available
- payments are enabled

---

## 9. QR Code Model (CRITICAL)

Canonical rule:
Each client has exactly ONE permanent QR code.

QR code encodes the following URL:
https://paytapper.net/tip/{clientId}

Properties:
- clientId is created once
- clientId never changes
- QR is deterministic
- QR is not stored
- QR is regenerated on demand

Consequences:
- QR does NOT change on login
- QR does NOT change after emails
- QR can be printed once and used forever

---

## 10. QR Availability

QR is visible only when:
- payoutMode = direct
- stripeState = active

QR is accessible via:
1. Dashboard (visual)
2. Downloadable PNG
3. Stripe-connected email

---

## 11. Email Lifecycle (strict)

### Email #1 — Welcome

Trigger:
- successful registration

Rules:
- sent exactly once
- protected by welcomeSentAt
- never triggered by clicks

Content:
- welcome message
- dashboard link
- reminder to connect Stripe

---

### Email #2 — Stripe connected + QR

Trigger:
- derived Stripe state becomes active

Rules:
- sent exactly once
- protected by stripeConnectedSentAt
- independent of user actions

Content:
- confirmation
- QR code
- tip link
- QR download link

---

## 12. UX Guardrails (mandatory)

Every form and button:
- shows loading state
- disables on submit
- prevents double submit

No side-effect may occur:
- on refresh
- on repeated click
- on navigation back/forward

---

## 13. Explicit Non-goals (v1)

- password recovery
- email verification
- social login
- roles
- admin UI
- QR rotation

---

## 14. Core Principle

A user action must never create irreversible side-effects
unless it is idempotent and clearly confirmed.

---

## Status
- Draft
- Reviewed
- Approved
- Implemented

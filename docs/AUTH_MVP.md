# Paytapper — AUTH MVP (Production Launch)

## Purpose
This document defines the authentication model required for the **initial production launch** of Paytapper.

Goal:
Allow real users to register, log in, connect Stripe, and start receiving tips.
No demo flows. No fake auth. No placeholders.

This document is a **source of truth** for auth-related decisions.
If something is not described here — it does not exist.

---

## Auth Strategy (MVP)

### Primary method (required)
- Email + password authentication
- Server-side validation only
- No client-side trust

### Optional extension (not required for launch)
- Google OAuth
- Implemented only if it does not complicate:
  - user model
  - storage
  - security guarantees
- If complexity increases — OAuth is deferred

---

## User Model

A new domain entity is introduced.

User {
  id: string
  email: string
  passwordHash?: string
  authProvider: "local" | "google"
  emailVerified: boolean
  createdAt: string
}

Rules:
- email must be unique
- passwordHash is always stored hashed (never plaintext)
- OAuth users may not have passwordHash
- emailVerified is required before allowing payouts

---

## Client ↔ User Relationship

- A Client is owned by exactly one User
- Ownership is explicit and server-validated
- One User may own multiple Clients (future-safe)
- A Client cannot exist without an owning User

Client extension (minimal):

Client {
  ownerUserId: string
}

Rules:
- ownerUserId is set on client creation
- ownerUserId is immutable
- All dashboard and mutating operations must validate ownership

---

## Registration Flow (Email + Password)

1. User submits:
   - email
   - password
   - password confirmation (must match)
2. Server validates:
   - email uniqueness
   - password strength (minimum length)
   - password confirmation
3. password is hashed (bcrypt or equivalent)
4. User is created with:
   - emailVerified = false
5. Verification email is sent
6. Until emailVerified = true:
   - Stripe Connect onboarding is blocked
   - payouts are blocked

---

## Login Flow

1. User submits email + password
2. Server verifies credentials
3. Secure session is created (HTTP-only cookie)
4. User is redirected to owned Client dashboard

Rules:
- No JWT in localStorage
- No client-side session forging
- Session validation is server-only

---

## Password UX Requirements (UI)

- Two password fields on registration:
  - password
  - confirm password
- Password visibility toggle (show / hide)
- Client-side checks are UX-only
- Server is the final authority

---

## Session Model (MVP)

- Cookie-based session
- HTTP-only
- Secure flag enabled in production
- SameSite=Lax

Session stores:
- userId
- createdAt
- expiresAt

---

## Security Rules (Non-Negotiable)

- No plaintext passwords ever
- No password echoing in logs
- No auth bypass for demo or test users
- All protected routes require:
  - valid session
  - ownership validation

---

## Stripe Interaction Constraints

- A User must be authenticated to:
  - create a Client
  - access dashboard
  - initiate Stripe Connect
- Stripe webhook logic remains unchanged
- Payments are still resolved by canonical paymentIntentId

---

## Non-Goals (MVP)

- Password reset (phase 2)
- Account deletion
- Role management
- Team access
- OAuth beyond Google

---

## Summary

This AUTH MVP enables:
- real user onboarding
- secure access control
- Stripe-safe payouts
- future extensibility

No shortcuts.
No demo logic.
Production only.

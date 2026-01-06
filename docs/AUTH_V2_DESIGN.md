Paytapper — Auth & Identity Architecture (v2)

Status:
Draft — architecture approved before implementation.
This document defines the canonical design for authentication, sessions,
password reset, and public identity in Paytapper v2.
No code may be written before this document is approved.

======================================================================

SECTION 1. SCOPE AND GOALS

Goals:
- Provide reliable login-based access to the client dashboard
- Enable secure password reset via email
- Remove dependency on token-only dashboard access
- Preserve all existing clients, payments, and Stripe integrations
- Improve trust for tip payers via visual identity (avatar / portrait)

Non-goals for v2:
- OAuth providers
- Team or role permissions
- Database migration
- Session refresh tokens
- Multi-factor authentication

======================================================================

SECTION 2. CORE PRINCIPLE

Source of truth for access:
- User + Session

Source of truth for public identity:
- Client

Authentication, payments, and public identity are strictly separated concerns.

======================================================================

SECTION 3. IDENTITY MODEL

User (Authentication Identity)

Represents a login-capable account.

User fields:
- id: string
- email: string (unique)
- passwordHash: string
- emailVerified: boolean
- createdAt: string

Rules:
- Email is the login identifier
- One email maps to exactly one User
- User is never exposed publicly

======================================================================

SECTION 4. CLIENT OWNERSHIP

Relationship:
Client.ownerUserId -> User.id

Rules:
- A User may own one or more Clients (future-proof)
- Dashboard access requires:
  - a valid session
  - ownership verification
- URL access alone never grants authorization

======================================================================

SECTION 5. SESSION MODEL (v2)

Sessions are server-trusted and mandatory for dashboard access.

Session fields:
- userId: string
- activeClientId: string (optional)
- expiresAt: string

Rules:
- Cookie-based
- HTTP-only
- Signed and versioned
- No raw JSON stored in cookies
- Session required for:
  - /client/*
  - /api/clients/*
  - /api/payments/* (dashboard scope)

======================================================================

SECTION 6. PASSWORD RESET ARCHITECTURE

PasswordResetToken model:

Fields:
- userId: string
- tokenHash: string
- expiresAt: string
- usedAt: string (optional)

Rules:
- Token is one-time use
- TTL: 30–60 minutes
- Raw token is sent by email only
- Only hashed token is persisted
- Tokens are never logged

======================================================================

SECTION 7. EMAIL FLOWS (RESEND)

Email events and rules:

Welcome email:
- Trigger: User created
- Rule: Sent once

Reset request email:
- Trigger: User requests password reset
- Rule: Always sent

Reset success email:
- Trigger: Password successfully updated
- Rule: Always sent

Global email rules:
- Emails are idempotent
- No business logic inside email templates
- Email delivery does not affect authentication state

======================================================================

SECTION 8. CLIENT VISUAL IDENTITY (AVATAR / PORTRAIT)

Purpose:
Increase trust and clarity for tip payers by visually identifying the recipient.

Model:
Avatar is a Client attribute, not a User attribute.

Client branding field:
- Client.branding.avatarUrl?: string

Usage:
- Displayed on:
  - /tip/{clientId}
  - Dashboard preview
  - QR code and payment link emails (where applicable)

Storage:
- Stored via blob storage
- Publicly accessible URL
- Uploaded and managed only by the Client owner

Rules:
- Avatar is optional
- Absence of avatar must not block payments
- Avatar changes do not affect payments or Stripe
- Avatar is not embedded into session or auth data

======================================================================

SECTION 9. DASHBOARD TOKEN (LEGACY v1)

Status:
- Deprecated as a primary access mechanism
- Retained as a fallback only

Rules:
- Not used for authenticated access in v2
- May be disabled after first successful login (v2.1)
- Never regenerated or reused

======================================================================

SECTION 10. API SURFACE (v2 PLAN)

New authentication routes:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/reset/request
- POST /api/auth/reset/confirm

Unchanged routes from v1:
- /api/payments/*
- /api/webhook
- /api/connect/*

======================================================================

SECTION 11. MIGRATION STRATEGY

- Existing Clients remain unchanged
- Users are created on first login or registration
- Ownership is linked via ownerUserId
- No Stripe or payment data is migrated

======================================================================

SECTION 12. INVARIANTS

- Stripe logic is immutable
- paymentStore is immutable
- clientStore invariants are preserved
- Auth is an additive layer only
- Build must be green after every step

======================================================================

SECTION 13. IMPLEMENTATION ORDER (STRICT)

1. Approve this document
2. Define auth-related types
3. Implement userStore
4. Implement authentication routes
5. Implement password reset
6. Update UI (login and dashboard)
7. Add avatar upload (post-auth)

END OF DOCUMENT

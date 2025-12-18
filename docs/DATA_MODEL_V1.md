# Paytapper — Data Model v1

## Purpose
This document defines the minimal data model required to support
authentication, registration, and stable client ownership in Paytapper v1.

The goal is to:
- preserve existing Client and Payment models
- introduce auth without breaking architecture
- avoid premature database complexity
- ensure backward-compatible evolution

This document must be applied before any auth-related code is written.

---

## 1. Guiding Principles

- Existing domain models remain the source of truth
- No breaking changes to Client or Payment
- New models must be minimal and explicit
- No implicit relationships
- All identifiers are immutable once created

---

## 2. Existing Models (unchanged)

### Client
Defined in lib/types.ts.

Rules:
- Client.id is immutable
- Client.id is created once at registration
- Client.emailEvents remain the authority for email idempotency
- Stripe-related fields remain unchanged

No new fields are added to Client for auth logic.

---

### Payment
Defined in lib/types.ts.

Rules:
- Canonical identifier remains stripe.paymentIntentId
- No auth-related fields added
- No changes required for auth v1

---

## 3. New Model: UserAuth

### Purpose
Represent authentication credentials and link them to a Client.

UserAuth is NOT a public domain model.
It is an internal auth construct.

---

### Fields

UserAuth {
  id: string
  clientId: string
  email: string
  passwordHash: string
  createdAt: string
}

---

### Rules

- email is unique
- clientId references exactly one Client
- One UserAuth per Client
- passwordHash is never exposed
- UserAuth is created only during registration

---

## 4. Storage Strategy (v1)

Auth data is stored separately from clients.json.

Logical file:
- auth.json

Rules:
- auth.json is handled only by authStore
- clients.json remains untouched by auth logic
- No cross-file writes without explicit intent

---

## 5. Session Model (v1)

Sessions are ephemeral and NOT persisted in JSON.

Session contents:
- userAuthId
- clientId

Session storage:
- cookie-based
- server-only
- HTTP-only cookie

No session data is written to disk.

---

## 6. Relationships

- UserAuth.email → unique
- UserAuth.clientId → Client.id
- Session.clientId → Client.id

At no point is clientId accepted directly from the frontend
as an authority for identity.

---

## 7. Idempotency Guarantees

Registration:
- email uniqueness guarantees no duplicate UserAuth
- client creation happens exactly once per email

Login:
- does not create or mutate any stored data

Emails:
- governed exclusively by Client.emailEvents

---

## 8. Explicit Non-goals

- Multiple users per client
- Multiple clients per user
- Role-based access
- Team accounts
- Auth migrations

---

## 9. Migration Safety

Existing Clients without auth:
- remain valid
- are not auto-migrated
- may be linked manually in future versions

No destructive migrations in v1.

---

## 10. Summary

Auth v1 introduces exactly one new persistent model: UserAuth.

Everything else remains unchanged.

---

## Status
- Draft
- Reviewed
- Approved
- Implemented

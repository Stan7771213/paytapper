# Paytapper — Auth v1

## Purpose
This document defines the minimal authentication model for Paytapper v1.

The goal is to:
- provide a real account-based experience
- prevent duplicate client creation
- ensure predictable login behavior
- allow safe future extension (password reset, email verification)

This is NOT a full auth system, but a controlled v1 foundation.

---

## 1. Core Principles

- Each user owns exactly ONE Client account
- Authentication is email + password based
- clientId is created once at registration
- clientId is resolved via auth session, never via user input
- No anonymous or magic account creation

---

## 2. Identity Model

### User identity
Primary identifier:
- email (unique)

Secondary:
- password (hashed)

Derived:
- clientId (internal, immutable)

Relationship:
One email → One user → One clientId

---

## 3. Registration Flow

### UI
Route:
/register

Fields:
- email
- password

Rules:
- email must be unique
- password is never stored in plain text
- submit button has loading + disabled state
- double submit is ignored

---

### Backend behavior

Endpoint:
POST /api/auth/register

Logic:
1. Normalize email (lowercase, trim)
2. Check if email already exists
3. If exists → return error
4. Create Client (once)
5. Hash password
6. Create auth record
7. Create session
8. Trigger Welcome email (idempotent)

Important:
- Client creation happens ONLY here
- No other endpoint may create Client implicitly

---

## 4. Login Flow

### UI
Route:
/login

Fields:
- email
- password

---

### Backend behavior

Endpoint:
POST /api/auth/login

Logic:
1. Validate credentials
2. Create session cookie
3. Redirect to dashboard

---

## 5. Session Model (v1)

- Session is cookie-based
- Cookie is HTTP-only
- Session contains:
  - userId
  - clientId
- Session expiration:
  - simple fixed TTL (e.g. 7 days)

No JWTs in v1.

---

## 6. Authorization Rules

- All dashboard routes require active session
- clientId is always derived from session
- URL clientId must match session clientId
- Mismatch → 403

Forbidden:
- passing clientId from frontend as authority
- accessing dashboard without auth

---

## 7. Logout

Endpoint:
POST /api/auth/logout

Behavior:
- destroy session
- redirect to landing page

---

## 8. Email Interaction with Auth

Emails NEVER:
- authenticate user
- create sessions
- change auth state

Emails MAY:
- link to dashboard (user must login if session expired)

---

## 9. Failure Modes (explicit)

- Wrong password → error
- Non-existing email → error
- Multiple register attempts → no duplicate Client
- Refresh during auth → safe

---

## 10. Non-goals (v1)

- password reset
- email verification
- magic links
- 2FA
- OAuth / social login

---

## 11. Security Baseline

- Passwords hashed (bcrypt or equivalent)
- Rate limiting (later)
- No sensitive data in URLs
- No auth logic in frontend

---

## Status
- Draft
- Reviewed
- Approved
- Implemented

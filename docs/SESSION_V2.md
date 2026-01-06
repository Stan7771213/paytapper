# Paytapper — Session v2 Design

## Context

Current session implementation (v1) uses a plain JSON cookie:

- Cookie value = JSON.stringify({ userAuthId, clientId })
- No signature
- No versioning
- No explicit expiresAt inside payload
- No middleware protection for /client/* routes

This was acceptable for early v1 but is NOT sufficient for:
- long-term production stability
- security hardening
- future role-based access
- multiple sessions per user

Session v2 addresses these limitations.

---

## Goals

Session v2 MUST:

1. Be cryptographically signed (tamper-proof)
2. Have an explicit version number
3. Contain an explicit expiresAt (ISO)
4. Be verifiable in middleware
5. Be backward-compatible for a short transition period
6. Not break existing users or Stripe/payment flows

Non-goals (for v2):
- JWT
- refresh tokens
- OAuth sessions
- multi-device session management

---

## Session Payload (v2)

Session payload is a JSON object:

SessionV2 {
  v: 2
  userAuthId: string
  clientId: string
  expiresAt: string (ISO)
}

Rules:
- expiresAt is authoritative
- server MUST reject expired sessions even if cookie exists
- no additional fields allowed

---

## Cookie Format

Cookie name (unchanged):
- paytapper_session

Cookie value:
- base64(payload).base64(signature)

Where:
- payload = JSON.stringify(SessionV2)
- signature = HMAC-SHA256(payload, SESSION_SECRET)

Environment:
- SESSION_SECRET (required in prod and dev)

---

## Verification Rules

A session is VALID if and only if:
1. Cookie exists
2. Payload parses correctly
3. v === 2
4. Signature is valid
5. expiresAt > now

Any failure → session is invalid.

Invalid session handling:
- cookie is cleared
- user treated as unauthenticated

---

## Middleware Protection

Middleware will guard:
- /client/*
- /api/clients
- future protected routes

Rules:
- If no valid session → redirect to /login (for pages)
- If API route → return 401 JSON

Public routes (no auth):
- /
- /login
- /register
- /reset-password
- /tip/*
- /api/auth/*

---

## Migration Strategy

Phase 1:
- Support v1 and v2 session formats in getSession()
- New logins create v2 sessions
- Old v1 sessions continue to work temporarily

Phase 2:
- Remove v1 support
- Force re-login for all users

---

## Files To Be Modified (planned)

- lib/session.ts (major refactor)
- middleware.ts (new)
- app/api/auth/login/route.ts (use v2 session)
- app/api/auth/register/route.ts (use v2 session)
- app/api/auth/logout/route.ts (unchanged)

---

## Safety Rules

- Stripe / payments / webhook code must NOT be touched
- No changes without green npm run build
- One file change per step
- Architecture document updated before code

---

## Status

- [x] Auth v2 (login / register / reset)
- [ ] Session v2 (this document)
- [ ] Middleware enforcement
- [ ] v1 session removal (later)


# Paytapper — Avatar & Branding (Client Portrait)

## Context

Paytapper is a trust-based product.
A payer should clearly see **who** they are tipping.

A client avatar (portrait) improves:
- trust
- conversion
- visual clarity on the tip page

This feature is **branding**, not identity verification.

---

## Goals

Avatar feature MUST:
1. Be optional
2. Be safe (no arbitrary file access)
3. Not affect payments, Stripe, or auth
4. Be easy to extend later (cover photo, branding kit)

Non-goals:
- Identity verification
- Face recognition
- KYC or legal confirmation
- Social profile syncing

---

## Data Model

We extend existing Client model:

Client.branding {
  avatarUrl?: string
}

Rules:
- avatarUrl is an absolute HTTPS URL
- stored once uploaded
- can be replaced (latest wins)
- no history tracking in v1

No other client fields are affected.

---

## Storage

Avatar files are stored in:
- Vercel Blob (same infra as JSON storage)

Rules:
- One avatar per client
- Deterministic path:
  avatars/{clientId}.jpg
- Overwrite allowed
- Public read access

No local filesystem usage in production.

---

## Upload Rules (Security)

Upload endpoint MUST:
- Require authenticated session
- Verify session.clientId === target clientId
- Accept only image MIME types:
  - image/jpeg
  - image/png
  - image/webp
- Enforce size limit (v1):
  - max 2 MB
- Reject all other content

No base64 uploads.
No direct client-side Blob writes.

---

## Processing

v1:
- No resizing
- No cropping
- No EXIF processing

Rationale:
- Keep implementation simple
- Avoid image processing vulnerabilities
- Can add processing later if needed

---

## UI Integration

Dashboard:
- Avatar upload / replace button
- Preview of current avatar

Tip page (/tip/{clientId}):
- Avatar displayed above name
- If no avatar:
  - fallback circle with initials

Avatar is purely visual:
- No functional dependency
- No payment logic coupling

---

## API Surface (planned)

POST /api/clients/avatar
- Auth required
- Multipart upload
- Replaces existing avatar
- Returns updated avatarUrl

GET:
- Avatar is accessed directly via CDN URL

---

## Rollout Strategy

Phase 1:
- Backend upload
- Client.branding.avatarUrl
- Dashboard upload UI

Phase 2 (later):
- Tip page visual polish
- Optional cropping
- Branding presets

---

## Safety Rules

- Stripe, payments, webhook MUST NOT be touched
- No breaking changes to Client schema
- No untyped fields
- One file change per step
- Build must stay green

---

## Status

- [ ] Document approved
- [ ] Backend upload
- [ ] Dashboard UI
- [ ] Tip page display


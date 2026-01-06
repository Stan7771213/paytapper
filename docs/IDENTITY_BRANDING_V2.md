Paytapper v2 — Identity & Branding Architecture

SCOPE
This document defines how identity and branding are handled in Paytapper v2.
This document is authoritative.

Identity includes:
- display name
- avatar (portrait)
- optional title
- optional description

CORE PRINCIPLES

1. Single source of truth
Identity data exists only in Client.displayName and Client.branding.
Identity data must not be duplicated or derived elsewhere.

2. Server-side identity
All identity (name, avatar, description) is rendered server-side.
Client components must not render or derive identity.

3. Client components are payment-only
Payment UI must not know about avatar, name, title, or branding.
Identity is passed implicitly by page composition, never via props.

DATA MODEL

Client.branding structure:

branding:
  title?: string
  description?: string
  avatarUrl?: string

Rules:
- avatarUrl is a public absolute URL
- avatarUrl is stored only via controlled API
- base64 images are forbidden
- inline blobs are forbidden

UPLOAD FLOW (AVATAR)

1. User uploads avatar from Dashboard
2. Request:
   POST /api/clients/avatar
   multipart/form-data
3. Server responsibilities:
   - validate session
   - validate client ownership
   - validate file type
   - validate file size
   - upload to Vercel Blob
   - store public URL in Client.branding.avatarUrl
4. Dashboard reloads server-rendered data

RENDERING RULES

Dashboard (/client/[clientId]/dashboard):
- Server Component
- Renders:
  - avatar (or fallback)
  - display name
  - email
- Reads data from Client.branding
- Upload logic is isolated in a client-only uploader component

Tip Page (/tip/[clientId]):
- Server Component
- Renders identity header:
  - avatar (or fallback)
  - display name or title
- Passes ONLY clientId to payment client

TipClient component:
- Client Component
- Receives:
  - clientId
- Must NOT receive:
  - avatar
  - displayName
  - branding
- Responsible ONLY for payment flow and Stripe redirect

FORBIDDEN PATTERNS

- Rendering identity inside client components
- Passing branding or displayName into TipClient
- Multiple identity headers on the same page
- Client-side identity derivation
- Storing avatars outside controlled Blob storage
- Base64 or inline image storage

EXTENSION GUIDELINES (FUTURE)

Allowed:
- Server-side image resizing
- CDN transformations
- Cropping UI in dashboard only
- Multiple branding themes

Not allowed:
- Identity logic inside payment flow
- Client-side avatar state
- Implicit identity fallbacks outside server pages

SUMMARY

Identity is a server concern.
Payments are a client concern.
There is one source of truth.
Types enforce architecture.

Any change to identity or branding requires updating this document first.

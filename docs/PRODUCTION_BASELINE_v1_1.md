# Paytapper — Production Baseline v1.1

## Status
This document defines the first production-ready baseline of Paytapper.
All statements below are considered the source of truth for live operation.

## Codebase
- Repository: https://github.com/Stan7771213/paytapper
- Branch: main
- Build requirement: `npm run build` must pass
- No uncommitted changes allowed before deploy

## Runtime
- Platform: Vercel
- Filesystem: read-only (EROFS)
- Persistent storage: Vercel Blob only

## Required Environment Variables

### Stripe mode
- STRIPE_MODE = "test" | "live"

### Stripe — test
(required if STRIPE_MODE="test")
- STRIPE_SECRET_KEY_TEST
- STRIPE_WEBHOOK_SECRET_TEST

### Stripe — live
(required if STRIPE_MODE="live")
- STRIPE_SECRET_KEY_LIVE
- STRIPE_WEBHOOK_SECRET_LIVE
- PAYTAPPER_LIVE_ACK = "1"

### Storage (production)
- BLOB_READ_WRITE_TOKEN

## Invariants
- No filesystem writes in production
- No silent fallbacks
- Missing environment variables must crash the app at startup
- Payments are persisted only by canonical key: stripe.paymentIntentId
- Placeholder or pending states are forbidden

## Deployment Rule
- This document must be valid and complete before any production deploy

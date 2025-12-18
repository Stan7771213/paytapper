# Paytapper — Emails v1

## Purpose
This document defines the email lifecycle for Paytapper v1.

Goals:
- guarantee zero duplicate emails
- make emails state-driven, not click-driven
- ensure predictable communication with users
- align backend logic with product expectations

Emails are side-effects of lifecycle events, not UI actions.

---

## 1. Core Principles

- Emails are triggered ONLY by state transitions
- Emails are NEVER triggered directly by button clicks
- Each email type is sent at most once per client
- Idempotency is mandatory for every email
- Email sending must be safe on retries

---

## 2. Email Types (v1)

Exactly two transactional emails exist in v1:

1. Welcome email
2. Stripe connected + QR email

No other emails are allowed in v1.

---

## 3. Welcome Email

### Purpose
Confirm account creation and guide user to next step.

---

### Trigger
- Successful registration
- Client is created for the first time

Trigger condition:
- client.email exists
- client.emailEvents.welcomeSentAt is NOT set

---

### Rules
- Sent exactly once
- Never sent again on:
  - login
  - page refresh
  - button clicks
  - repeated registration attempts

Idempotency key:
- clientId + "welcome"

---

### Content
- Welcome message
- Dashboard link
- Explanation that Stripe must be connected to receive tips
- No QR code

---

### Persistence
On successful send:
- set client.emailEvents.welcomeSentAt = ISO timestamp

If sending fails:
- do NOT set welcomeSentAt
- allow retry on next safe trigger

---

## 4. Stripe Connected + QR Email

### Purpose
Notify user that payments are now enabled and provide QR code.

---

### Trigger
Derived Stripe state transitions to "active".

Trigger condition:
- payoutMode = direct
- stripeState = active
- client.email exists
- client.emailEvents.stripeConnectedSentAt is NOT set

---

### Rules
- Sent exactly once
- Independent of user clicks
- Must not be sent before Stripe is fully active

Idempotency key:
- clientId + "stripeConnected"

---

### Content
- Confirmation that Stripe is connected
- QR code (visual)
- Tip link
- Downloadable QR link
- Dashboard link

---

### Persistence
On successful send:
- set client.emailEvents.stripeConnectedSentAt = ISO timestamp

If sending fails:
- do NOT set stripeConnectedSentAt
- allow retry on next safe lifecycle check

---

## 5. What is a "Safe Trigger"

Emails may be evaluated and sent during:
- backend lifecycle checks
- post-login dashboard load (server-side)
- scheduled jobs (future)

Emails must NOT be sent during:
- form submit handlers
- button onClick
- client-side effects
- page refresh without state change

---

## 6. Failure and Retry Behavior

- Email send failure must be explicit
- No silent success
- No placeholder timestamps
- Retry allowed only if timestamp is missing

---

## 7. Forbidden Patterns

- Sending emails directly from UI components
- Sending emails inside button handlers
- Sending emails based on URL visits
- Sending emails without idempotency checks

---

## 8. Observability (v1 minimal)

Each email attempt should be logged with:
- clientId
- email type
- result (success / failure)
- timestamp

No analytics or tracking pixels in v1.

---

## 9. Non-goals (v1)

- marketing emails
- newsletters
- reminders
- email verification
- unsubscribe flows

---

## 10. Core Rule (summary)

An email must be a consequence of state,
never a consequence of a click.

---

## Status
- Draft
- Reviewed
- Approved
- Implemented

# Paytapper — First Client Checklist

Internal checklist for running the **first real client payment** calmly and without surprises.

Use this **step by step**. Do not skip items.

---

## 1) Before the client arrives

### Environment
- STRIPE_MODE = `live`
- PAYTAPPER_LIVE_ACK = `1`
- Domain is correct and public (`paytapper.net`)
- Latest commit is deployed on Vercel
- `npm run build` is green locally

### Stripe
- Stripe Dashboard shows **LIVE mode**
- Webhook `/api/webhook` is active
- Event `payment_intent.succeeded` has recent successful deliveries

### Client dashboard
- Dashboard opens:
  `/client/{clientId}/dashboard`
- Stripe mode badge shows **LIVE**
- Stripe connection status = **Connected**
- Tip link opens correctly
- QR code is visible and downloadable (PNG)

### Mandatory pre-test
- You personally completed **one €1 LIVE payment**
- Receipt page loaded correctly
- Dashboard shows:
  - status = `paid`
  - platform fee = 10%
  - net amount correct

Do **not** proceed without this.

---

## 2) During the first real payment

- Be physically nearby or immediately available
- Ask the client to:
  1. Open the QR code or tip link
  2. Choose a simple amount (e.g. €2–€5)
  3. Complete payment normally

Do not explain technical details unless asked.

---

## 3) Immediately after payment

### Receipt (client screen)
- Headline shows **Payment confirmed** or **Preparing your receipt**
- If status = `processing`:
  - wait up to 10 seconds
  - refresh once if needed

### Dashboard (your screen)
- Open client dashboard
- Confirm:
  - payment appears in **Recent payments**
  - status = `paid`
  - gross / fee / net are correct
  - timestamp is correct

---

## 4) If something looks delayed

This is normal in rare cases.

Steps:
1. Wait up to **30 seconds**
2. Refresh dashboard
3. Check Stripe → Events:
   - `payment_intent.succeeded`
4. Confirm webhook delivery = **200 OK**

Do NOT:
- panic
- ask the client to pay again
- reload multiple times in a row

---

## 5) After successful confirmation

Say something simple and calm:
> “Everything worked. You can start using this with guests.”

Then:
- suggest where to place the QR code
- explain that one QR works everywhere
- ask for feedback after a few uses

---

## 6) Red flags (STOP onboarding)

Stop immediately and investigate if:
- Payment succeeded in Stripe but **never appears** in dashboard
- Webhook shows repeated delivery failures
- Platform fee or net amount is incorrect
- Receipt page shows inconsistent data

Do NOT onboard additional clients until resolved.

---

This checklist exists to ensure the **first impression is calm, professional, and trustworthy**.

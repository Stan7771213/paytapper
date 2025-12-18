// lib/types.ts

// ---------- Shared ----------
export type Currency = "eur";

export const PLATFORM_FEE_PERCENT = 10;

// ---------- Client ----------
export type Client = {
  id: string;
  displayName: string;
  email?: string;
  isActive: boolean;
  createdAt: string; // ISO
  payoutMode: "direct" | "platform";

  /**
   * Dashboard access token (v1 guard)
   * - Generated once on client creation
   * - Never rotated or overwritten
   * - Passed as ?token=... to /client/[clientId]/dashboard
   */
  dashboardToken: string;

  stripe?: {
    accountId?: string;
  };

  branding?: {
    title?: string;
    description?: string;
    avatarUrl?: string;
  };

  emailEvents?: {
    welcomeSentAt?: string; // ISO
    stripeConnectedSentAt?: string; // ISO
  };
};

export type NewClient = {
  displayName: string;
  email?: string;
  payoutMode: "direct" | "platform";
  branding?: Client["branding"];
};

// ---------- Payment ----------
export type PaymentStatus = "created" | "paid" | "failed" | "refunded";

export type Payment = {
  id: string;
  clientId: string;

  amountCents: number;
  currency: Currency;

  platformFeeCents: number;
  netAmountCents: number;

  status: PaymentStatus;

  stripe: {
    checkoutSessionId: string;
    paymentIntentId: string; // canonical Stripe identifier (required)
  };

  createdAt: string; // ISO
  paidAt?: string; // ISO

  payer?: {
    email?: string;
    country?: string;
  };
};

/**
 * NewPayment
 * Used internally before persistence (e.g., for initiating Checkout creation).
 * Must not contain fields not defined in architecture.
 */
export type NewPayment = {
  clientId: string;
  amountCents: number;
  currency?: Currency;
};

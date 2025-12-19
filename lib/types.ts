// lib/types.ts

// ---------- Shared ----------
export type Currency = "eur";

export const PLATFORM_FEE_PERCENT = 10;

// ---------- User ----------
export type AuthProvider = "local" | "google";

export type User = {
  id: string;
  email: string;

  authProvider: AuthProvider;

  // For local auth only
  passwordHash?: string;

  emailVerified: boolean;

  createdAt: string;
};

// ---------- Client ----------
export type Client = {
  id: string;

  // Ownership
  ownerUserId: string;

  displayName: string;
  email?: string;

  isActive: boolean;
  createdAt: string;

  payoutMode: "direct" | "platform";

  stripe?: {
    accountId?: string;
  };

  branding?: {
    title?: string;
    description?: string;
    avatarUrl?: string;
  };

  emailEvents?: {
    welcomeSentAt?: string;
    stripeConnectedSentAt?: string;
  };

  // Set-once, used for dashboard access links (v1)
  dashboardToken: string;
};

// ---------- Creation DTOs ----------
export type NewClient = {
  displayName: string;
  email?: string;
  payoutMode: "direct" | "platform";
  ownerUserId: string;
};

// ---------- Payments ----------
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
    paymentIntentId: string;
    checkoutSessionId: string;
  };

  createdAt: string;
  paidAt?: string;

  payer?: {
    email?: string;
    country?: string;
  };
};

export type NewPayment = {
  clientId: string;
  amountCents: number;
  currency: Currency;
};

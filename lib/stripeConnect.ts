import type Stripe from "stripe";

export type StripeConnectState =
  | "not_created"
  | "onboarding"
  | "restricted"
  | "active";

export type StripeConnectSignals = {
  hasAccountId: boolean;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsCurrentlyDueCount: number;
  requirementsPastDueCount: number;
  disabledReason: string | null;
};

export function extractConnectSignals(
  accountId: string | undefined,
  acct: Stripe.Account | null
): StripeConnectSignals {
  const hasAccountId = Boolean(accountId && accountId.trim());

  const chargesEnabled = Boolean(acct?.charges_enabled);
  const detailsSubmitted = Boolean(acct?.details_submitted);

  const requirementsCurrentlyDueCount = Array.isArray(acct?.requirements?.currently_due)
    ? acct.requirements.currently_due.length
    : 0;

  const requirementsPastDueCount = Array.isArray(acct?.requirements?.past_due)
    ? acct.requirements.past_due.length
    : 0;

  const disabledReason =
    typeof acct?.requirements?.disabled_reason === "string"
      ? acct.requirements.disabled_reason
      : null;

  return {
    hasAccountId,
    chargesEnabled,
    detailsSubmitted,
    requirementsCurrentlyDueCount,
    requirementsPastDueCount,
    disabledReason,
  };
}

export function deriveStripeConnectState(
  s: StripeConnectSignals
): StripeConnectState {
  if (!s.hasAccountId) return "not_created";
  if (!s.detailsSubmitted) return "onboarding";

  const isRestricted =
    !s.chargesEnabled ||
    s.requirementsPastDueCount > 0 ||
    Boolean(s.disabledReason);

  if (isRestricted) return "restricted";
  return "active";
}

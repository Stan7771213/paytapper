"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

interface StartOnboardingButtonProps {
  clientId?: string;
}

type ApiErrorResponse = { error?: unknown };

function getErrorMessage(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  if (!("error" in data)) return null;
  const err = (data as ApiErrorResponse).error;
  return typeof err === "string" ? err : null;
}

export function StartOnboardingButton({ clientId }: StartOnboardingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const clientIdFromUrl = segments[1];
  const effectiveClientId = clientIdFromUrl || clientId || "";

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      if (!effectiveClientId) {
        throw new Error("Client ID is missing on this page.");
      }

      // 1) Create / ensure Stripe account
      const createRes = await fetch("/api/connect/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: effectiveClientId }),
      });

      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}));
        throw new Error(
          getErrorMessage(data) ?? "Could not create Stripe account"
        );
      }

      const createData = (await createRes.json()) as { accountId?: string };
      const accountId = createData.accountId;

      if (!accountId) {
        throw new Error("Stripe accountId missing after creation");
      }

      // 2) Request onboarding link (pass accountId explicitly)
      const onboardRes = await fetch("/api/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: effectiveClientId,
          accountId,
        }),
      });

      if (!onboardRes.ok) {
        const data = await onboardRes.json().catch(() => ({}));
        throw new Error(
          getErrorMessage(data) ?? "Could not create Stripe onboarding link"
        );
      }

      const onboardData = (await onboardRes.json()) as { url?: string };
      if (!onboardData.url) {
        throw new Error("Stripe onboarding URL missing");
      }

      window.location.href = onboardData.url;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
      >
        {loading ? "Opening Stripe…" : "Connect Stripe to receive payouts"}
      </button>

      <p className="text-xs text-muted-foreground">
        You’ll be redirected to Stripe to finish setup. It usually takes 2–3 minutes.
      </p>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

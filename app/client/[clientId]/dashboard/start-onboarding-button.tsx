"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

interface StartOnboardingButtonProps {
  clientId?: string; // Optional: we primarily read from the URL
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

  // Read clientId from the route: /client/[clientId]/dashboard
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  // segments = ["client", "<clientId>", "dashboard"]
  const clientIdFromUrl = segments[1];

  const effectiveClientId = clientIdFromUrl || clientId || "";

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      if (!effectiveClientId) {
        throw new Error("Client ID is missing on this page.");
      }

      // 1) Ensure a connected account exists (idempotent).
      const createRes = await fetch("/api/connect/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: effectiveClientId }),
      });

      if (!createRes.ok) {
        const data: unknown = await createRes.json().catch(() => ({}));
        const message = getErrorMessage(data);
        throw new Error(message ?? "Could not create a Stripe connected account.");
      }

      // 2) Request an onboarding link (requires accountId).
      const onboardRes = await fetch("/api/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: effectiveClientId }),
      });

      if (!onboardRes.ok) {
        const data: unknown = await onboardRes.json().catch(() => ({}));
        const message = getErrorMessage(data);
        throw new Error(message ?? "Could not create a Stripe onboarding link.");
      }

      const data: unknown = await onboardRes.json();
      const url =
        typeof data === "object" && data !== null && "url" in data
          ? (data as { url?: unknown }).url
          : undefined;

      if (typeof url !== "string" || !url.trim()) {
        throw new Error("Stripe onboarding URL is missing.");
      }

      window.location.href = url;
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
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

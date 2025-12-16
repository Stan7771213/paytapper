"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

interface StartOnboardingButtonProps {
  clientId?: string; // Optional: we primarily read from the URL
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

      const res = await fetch("/api/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: effectiveClientId }),
      });

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => ({}));
        const maybeError =
          typeof data === "object" && data !== null && "error" in data
            ? (data as { error?: unknown }).error
            : undefined;

        throw new Error(
          typeof maybeError === "string"
            ? maybeError
            : "Could not create a Stripe onboarding link."
        );
      }

      const data: unknown = await res.json();
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

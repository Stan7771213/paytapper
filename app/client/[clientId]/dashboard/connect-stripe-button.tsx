"use client";

import { useState } from "react";

type OnboardResponse = { url: string } | { error: string };

export function ConnectStripeButton({ clientId }: { clientId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    try {
      setError(null);
      setIsLoading(true);

      const res = await fetch("/api/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });

      const data = (await res.json()) as OnboardResponse;

      if (!res.ok) {
        const message =
          "error" in data && typeof data.error === "string"
            ? data.error
            : "Failed to start onboarding";
        throw new Error(message);
      }

      if (!("url" in data) || typeof data.url !== "string" || !data.url) {
        throw new Error("Invalid onboarding response");
      }

      window.location.href = data.url;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={start}
        disabled={isLoading}
        className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
      >
        {isLoading ? "Connecting…" : "Connect Stripe"}
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

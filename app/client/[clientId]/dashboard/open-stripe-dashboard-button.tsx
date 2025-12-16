"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

export function OpenStripeDashboardButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  // /client/[clientId]/dashboard → ["client", "<clientId>", "dashboard"]
  const clientId = segments[1] || "";

  async function handleClick() {
    try {
      setLoading(true);
      setError(null);

      if (!clientId) {
        throw new Error("Client ID is missing on this page.");
      }

      const res = await fetch("/api/stripe/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
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
            : "Could not create a Stripe login link."
        );
      }

      const data: unknown = await res.json();
      const url =
        typeof data === "object" && data !== null && "url" in data
          ? (data as { url?: unknown }).url
          : undefined;

      if (typeof url !== "string" || !url.trim()) {
        throw new Error("Stripe login URL is missing.");
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
        {loading ? "Opening Stripe…" : "Open Stripe dashboard"}
      </button>

      <p className="text-xs text-muted-foreground">
        This opens your Stripe dashboard in a secure session.
      </p>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

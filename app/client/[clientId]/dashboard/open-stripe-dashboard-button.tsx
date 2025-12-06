"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

export function OpenStripeDashboardButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  // /client/[clientId]/dashboard → ["client", "test123", "dashboard"]
  const clientId = segments[1] || "";

  async function handleClick() {
    try {
      setLoading(true);
      setError(null);

      if (!clientId) {
        throw new Error("clientId is missing on this page");
      }

      const res = await fetch("/api/stripe/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || "Failed to create Stripe login link"
        );
      }

      const data = await res.json();
      if (!data.url) {
        throw new Error("Stripe login URL is missing");
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
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
        {loading ? "Opening Stripe..." : "Open Stripe Dashboard"}
      </button>
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}


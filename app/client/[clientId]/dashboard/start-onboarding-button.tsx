"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

interface StartOnboardingButtonProps {
  clientId?: string; // оставляем опционально, но будем брать из URL
}

export function StartOnboardingButton({
  clientId,
}: StartOnboardingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Берём clientId из адресной строки: /client/[clientId]/dashboard
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  // segments = ["client", "test123", "dashboard"]
  const clientIdFromUrl = segments[1];

  const effectiveClientId = clientIdFromUrl || clientId || "";

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      if (!effectiveClientId) {
        throw new Error("clientId is missing on this page");
      }

      const res = await fetch("/api/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: effectiveClientId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || "Failed to create onboarding link"
        );
      }

      const data = await res.json();
      if (!data.url) {
        throw new Error("Stripe onboarding URL is missing");
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
        {loading
          ? "Redirecting to Stripe..."
          : "Start / Continue Stripe onboarding"}
      </button>
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}


"use client";

import { useState } from "react";

export function OpenStripeDashboardButton({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/connect/login?clientId=" + encodeURIComponent(clientId),
        { method: "POST" }
      );

      if (!res.ok) {
        alert("Failed to open Stripe dashboard");
        return;
      }

      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="rounded-lg border px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
    >
      {loading ? "Opening Stripe…" : "Open Stripe dashboard"}
    </button>
  );
}

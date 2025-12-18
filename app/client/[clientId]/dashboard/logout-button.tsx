"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLogout() {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const r = await fetch("/api/auth/logout", { method: "POST" });
      if (!r.ok) {
        setError("Logout failed");
        return;
      }
      router.replace("/");
    } catch {
      setError("Logout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={onLogout}
        disabled={loading}
        className="border rounded-md px-3 py-2 text-sm"
      >
        {loading ? "Logging out…" : "Log out"}
      </button>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

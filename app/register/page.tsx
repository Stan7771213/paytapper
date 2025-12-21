"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const displayName = String(formData.get("displayName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          email,
          password,
          passwordConfirm: confirmPassword, // 🔴 ВАЖНО
        }),
      });

      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data?.error || "Registration failed");
      }

      window.location.href = "/post-auth";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Create account</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          name="displayName"
          placeholder="Name (optional)"
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />

        <input
          name="confirmPassword"
          type="password"
          placeholder="Repeat password"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md border border-gray-700 px-3 py-2 text-sm font-medium hover:bg-gray-900 hover:text-white disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create account"}
        </button>
      </form>
    </main>
  );
}

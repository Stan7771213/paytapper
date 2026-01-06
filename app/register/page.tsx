"use client";

import { useState } from "react";

type RegisterResponse =
  | { userId: string; clientId: string }
  | { error: string };

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = (await res.json()) as RegisterResponse;

      if (!res.ok) {
        const msg = "error" in data ? data.error : "Registration failed";
        throw new Error(msg);
      }

      if (!("clientId" in data) || !data.clientId) {
        throw new Error("Invalid server response");
      }

      window.location.href = `/client/${encodeURIComponent(data.clientId)}/dashboard`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <p className="mt-2 text-sm text-gray-400">
        Create your Paytapper account to start accepting tips.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-200">Email</label>
          <input
            className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm outline-none focus:border-gray-500"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-200">Password</label>
          <input
            className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm outline-none focus:border-gray-500"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            required
          />
        </div>

        {error ? (
          <div className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <button
          className="w-full rounded-md border border-gray-700 px-3 py-2 text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create account"}
        </button>

        <div className="pt-2 text-sm text-gray-300">
          Already have an account?{" "}
          <a className="underline" href="/login">
            Log in
          </a>
        </div>
      </form>
    </main>
  );
}

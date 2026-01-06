"use client";

import { useEffect, useState } from "react";

type ApiResponse =
  | { ok: true }
  | { error: string };

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
  }, []);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) throw new Error("Request failed");
      setDone(true);
    } catch (err) {
      setError("Unable to process request");
    } finally {
      setLoading(false);
    }
  }

  async function submitConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = (await res.json()) as ApiResponse;

      if (!res.ok || "error" in data) {
        throw new Error("Reset failed");
      }

      setDone(true);
    } catch (err) {
      setError("Unable to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold">Reset password</h1>

      {!token ? (
        <>
          <p className="mt-2 text-sm text-gray-400">
            Enter your email to receive a password reset link.
          </p>

          {done ? (
            <div className="mt-6 rounded-md border border-green-800 bg-green-950/40 px-3 py-2 text-sm text-green-200">
              If an account exists for this email, a reset link has been sent.
            </div>
          ) : (
            <form onSubmit={submitRequest} className="mt-6 space-y-4">
              <input
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {error && (
                <div className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                className="w-full rounded-md border border-gray-700 px-3 py-2 text-sm hover:bg-gray-900 disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-gray-400">
            Set a new password for your account.
          </p>

          {done ? (
            <div className="mt-6 rounded-md border border-green-800 bg-green-950/40 px-3 py-2 text-sm text-green-200">
              Password updated. You can now <a href="/login" className="underline">log in</a>.
            </div>
          ) : (
            <form onSubmit={submitConfirm} className="mt-6 space-y-4">
              <input
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm"
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              {error && (
                <div className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                className="w-full rounded-md border border-gray-700 px-3 py-2 text-sm hover:bg-gray-900 disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
          )}
        </>
      )}
    </main>
  );
}

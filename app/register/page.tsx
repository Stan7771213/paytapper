"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type RegisterOk = {
  ok: true;
  clientId?: string;
};

type RegisterErr = {
  error: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<boolean>(false);

  const canSubmit = useMemo(() => {
    return !submitting && email.trim().length > 0 && password.length > 0;
  }, [submitting, email, password]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data: unknown = await r.json().catch(() => null);

      if (!r.ok) {
        const msg =
          isRecord(data) && typeof data.error === "string"
            ? data.error
            : "Registration failed";
        setError(msg);
        return;
      }

      if (!isRecord(data) || data.ok !== true) {
        setError("Unexpected response from server");
        return;
      }

      const ok = data as RegisterOk;
      setDone(true);

      if (typeof ok.clientId === "string" && ok.clientId.trim()) {
        router.replace(`/client/${ok.clientId}/dashboard`);
        return;
      }

      // Session is set server-side. Until the API returns clientId, we safely route to landing.
      router.replace("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Create your account</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="w-full border rounded-md px-3 py-2"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            disabled={submitting || done}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="w-full border rounded-md px-3 py-2"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            disabled={submitting || done}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {done && !error && (
          <p className="text-sm text-green-700">
            Account created. Redirecting…
          </p>
        )}

        <button
          className="w-full border rounded-md px-3 py-2 font-medium"
          type="submit"
          disabled={!canSubmit || done}
        >
          {submitting ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="text-sm text-gray-600">
        Already have an account?{" "}
        <a className="underline" href="/login">
          Log in
        </a>
      </p>
    </main>
  );
}

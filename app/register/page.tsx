"use client";

import { useState } from "react";

type RegisterOk = {
  ok: true;
  email?: {
    sent: boolean;
    mode?: string;
    message?: string;
    messageId?: string | null;
  };
};

type RegisterErr = { error: string };

type RegisterResponse = RegisterOk | RegisterErr;

function isRegisterOk(x: RegisterResponse): x is RegisterOk {
  return "ok" in x && x.ok === true;
}

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [emailStatus, setEmailStatus] = useState<{
    sent: boolean;
    message?: string;
  } | null>(null);

  const [canContinue, setCanContinue] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setEmailStatus(null);
    setCanContinue(false);

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
          passwordConfirm: confirmPassword, // IMPORTANT: backend expects passwordConfirm
        }),
      });

      const data = (await r.json().catch(() => ({}))) as RegisterResponse;

      if (!r.ok) {
        const msg =
          "error" in data && typeof data.error === "string"
            ? data.error
            : "Registration failed";
        throw new Error(msg);
      }

      if (!isRegisterOk(data)) {
        setEmailStatus({
          sent: false,
          message: "Registration succeeded, but response was unexpected.",
        });
        setCanContinue(true);
        return;
      }

      const emailRes = data.email;

      if (emailRes) {
        setEmailStatus({
          sent: emailRes.sent,
          message: emailRes.message,
        });
      } else {
        // Backward compatible: if API doesn't return email status for some reason
        setEmailStatus({
          sent: true,
          message: "Account created successfully.",
        });
      }

      setCanContinue(true);
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

        {emailStatus && (
          <div
            className={`rounded-md border px-3 py-2 text-sm ${
              emailStatus.sent
                ? "border-green-300 bg-green-50 text-green-800"
                : "border-amber-300 bg-amber-50 text-amber-900"
            }`}
          >
            {emailStatus.sent ? (
              <div>
                <div className="font-medium">Welcome email sent.</div>
                <div className="mt-1 opacity-80">
                  Please check your inbox (and Promotions/Spam).
                </div>
              </div>
            ) : (
              <div>
                <div className="font-medium">We couldn’t send the welcome email.</div>
                <div className="mt-1 opacity-80">
                  {emailStatus.message ||
                    "Please double-check your email address and try again."}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md border border-gray-700 px-3 py-2 text-sm font-medium hover:bg-gray-900 hover:text-white disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create account"}
        </button>

        <button
          type="button"
          disabled={!canContinue}
          onClick={() => (window.location.href = "/post-auth")}
          className="w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
        >
          Continue to dashboard
        </button>
      </form>
    </main>
  );
}

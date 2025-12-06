"use client";

import React, { useState } from "react";

type Mode = "signin" | "register";

type ApiUser = {
  userId?: string;
  email?: string;
  createdAt?: string;
};

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    if (mode === "register" && password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);

      const url =
        mode === "signin" ? "/api/auth" : "/api/auth/register";

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed.");
        return;
      }

      // 🧠 data может быть как { email, ... }, так и { user: { email, ... } }
      const user: ApiUser =
        (data && data.user) ? data.user : data;

      // ✅ Сохраняем в localStorage только объект пользователя
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "paytapperUser",
          JSON.stringify(user)
        );
      }

      const userEmail = user.email || email;

      if (mode === "signin") {
        setSuccess(`Signed in as ${userEmail} (demo).`);
      } else {
        setSuccess(`Account created for ${userEmail} (demo).`);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchToSignIn = () => {
    setMode("signin");
    setError(null);
    setSuccess(null);
  };

  const switchToRegister = () => {
    setMode("register");
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl">
          <h1 className="text-2xl font-semibold mb-2 text-center">
            {mode === "signin"
              ? "Sign in to Paytapper"
              : "Create a Paytapper account"}
          </h1>
          <p className="text-xs text-gray-400 mb-6 text-center">
            Client access to payouts and QR links (demo version).
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                className="w-full rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Password</label>
              <input
                type="password"
                className="w-full rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-gray-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-xs text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="text-xs text-emerald-400">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-white text-black rounded-lg py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Please wait..."
                : mode === "signin"
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-gray-400">
            {mode === "signin" ? (
              <>
                No account yet?{" "}
                <button
                  type="button"
                  onClick={switchToRegister}
                  className="underline text-gray-200"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={switchToSignIn}
                  className="underline text-gray-200"
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          <p className="mt-6 text-[10px] text-gray-500 text-center leading-relaxed">
            In this demo version we only simulate login and account
            creation using a local JSON file. Later we can add a real
            dashboard, sessions and database.
          </p>
        </div>
      </div>
    </div>
  );
}


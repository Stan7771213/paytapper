"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(
    "Registration is temporarily disabled in v1."
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("Registration is temporarily disabled in v1.");
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-start justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-semibold mb-8">Create your account</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Email</label>
            <input
              className="w-full rounded-md bg-white text-black px-3 py-2 outline-none"
              type="email"
              disabled
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Password</label>
            <input
              className="w-full rounded-md bg-black text-white border border-gray-700 px-3 py-2 outline-none"
              type="password"
              disabled
              placeholder="********"
            />
          </div>

          {error ? (
            <p className="text-sm text-yellow-400">{error}</p>
          ) : null}

          <button
            className="w-full rounded-md border border-gray-700 px-3 py-2 text-sm font-medium opacity-60 cursor-not-allowed"
            type="submit"
            disabled
          >
            Registration disabled
          </button>

          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <a className="underline hover:text-white" href="/login">
              Log in
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
